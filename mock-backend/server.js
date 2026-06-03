const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'secret';

// Mock Data
let shipments = [
    { id: 'SHP-IN-01', order_id: 'ORD-9912', origin: 'Mumbai', destination: 'Delhi', status: 'in_transit', carrier: 'Blue Dart', origin_lat: 19.0760, origin_lng: 72.8777, dest_lat: 28.6139, dest_lng: 77.2090, current_lat: 23.0, current_lng: 74.0, eta: new Date(Date.now() + 86400000).toISOString() },
    { id: 'SHP-IN-02', order_id: 'ORD-9913', origin: 'Chennai', destination: 'Bengaluru', status: 'delayed', carrier: 'Delhivery', origin_lat: 13.0827, origin_lng: 80.2707, dest_lat: 12.9716, dest_lng: 77.5946, current_lat: 13.0, current_lng: 79.0, eta: new Date(Date.now() + 86400000 * 5).toISOString() }
];

let alerts = [
    { id: 'ALT-IN-101', shipment_id: 'SHP-IN-02', type: 'delay', severity: 'high', message: 'Truck delayed by heavy monsoon rain on highway.', acked: false, created_at: new Date().toISOString() },
    { id: 'ALT-IN-102', shipment_id: null, type: 'inventory', severity: 'critical', message: 'SKU MCU-A100 below safety stock at Mumbai Hub.', acked: false, created_at: new Date().toISOString() }
];

let inventory = [
    { id: 1, sku_id: 'MCU-A100', warehouse_id: 'WH-IND-W', warehouse_name: 'Mumbai Hub', quantity: 3000, safety_stock: 6000, daily_demand: 800, unit_cost: 12.50 },
    { id: 2, sku_id: 'SENS-X7', warehouse_id: 'WH-IND-S', warehouse_name: 'Chennai Hub', quantity: 1500, safety_stock: 2000, daily_demand: 150, unit_cost: 45.00 }
];

let replans = [
    { id: 'REC-IN-201', alert_id: 'ALT-IN-102', sku_id: 'MCU-A100', action: 'expedite_air_freight', qty: 5000, supplier_name: 'Tata Electronics', estimated_cost: 12500, status: 'open', urgency: 'critical', created_at: new Date().toISOString() }
];

const CUSTOM_ROUTES_FILE = './custom_routes.json';
if (fs.existsSync(CUSTOM_ROUTES_FILE)) {
    try {
        const savedRoutes = JSON.parse(fs.readFileSync(CUSTOM_ROUTES_FILE, 'utf8'));
        shipments.push(...savedRoutes);
    } catch (e) {
        console.error('Failed to load saved custom routes:', e);
    }
}

// Routes
app.post('/api/auth/login', (req, res) => {
    if (req.body.password === 'password123') {
        const isCustomer = req.body.email.toLowerCase().includes('customer');
        const token = jwt.sign({ email: req.body.email }, JWT_SECRET);
        res.json({ 
            data: { 
                token, 
                user: { 
                    email: req.body.email, 
                    name: isCustomer ? 'Customer' : 'Admin', 
                    role: isCustomer ? 'customer' : 'admin' 
                } 
            } 
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/shipments', (req, res) => res.json({ data: shipments }));
app.get('/api/alerts', (req, res) => res.json({ data: alerts.filter(a => !a.acked) }));
app.post('/api/alerts/:id/ack', (req, res) => {
    alerts = alerts.map(a => a.id === req.params.id ? { ...a, acked: true } : a);
    res.json({ data: { success: true } });
});
app.get('/api/inventory', (req, res) => res.json({ data: inventory }));
app.get('/api/replans', (req, res) => res.json({ data: replans }));
app.post('/api/replans/:id/ack', (req, res) => {
    replans = replans.map(r => r.id === req.params.id ? { ...r, status: req.body.action === 'approve' ? 'approved' : 'rejected' } : r);
    res.json({ data: { success: true } });
});
app.get('/api/kpis', (req, res) => res.json({ data: { onTimeRate: 94.2, avgDelay: 45, fillRate: 96.5, openAlerts: alerts.filter(a => !a.acked).length, activeShipments: 2 } }));
app.get('/api/kpis/trend', (req, res) => {
    let trend = [];
    for(let i=0; i<24; i++) trend.push({ timestamp: `${i}:00`, onTimeRate: 92 + Math.random()*5, avgDelay: 40 + Math.random()*10, fillRate: 95 + Math.random()*2, activeShipments: 50 });
    res.json({ data: trend });
});

app.post('/api/regions', async (req, res) => {
    const { country } = req.body;
    if (!country) return res.status(400).json({ error: 'Country is required' });

    try {
        // Fetch coordinates from Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(country)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'SupplyWatch AI Mock Backend' }
        });
        const data = await response.json();
        
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        // Generate ID prefix
        const prefix = country.substring(0, 3).toUpperCase();
        const randId = Math.floor(Math.random() * 1000);

        // Generate new Warehouse
        const whId = `WH-${prefix}-${randId}`;
        inventory.push({
            id: inventory.length + 1,
            sku_id: 'SENS-X7', warehouse_id: whId, warehouse_name: `${country} Hub`,
            quantity: 5000, safety_stock: 2000, daily_demand: 400, unit_cost: 35.00
        });

        // Generate 2 new Shipments around this location
        const shp1Id = `SHP-${prefix}-${randId}-1`;
        const shp2Id = `SHP-${prefix}-${randId}-2`;
        
        shipments.push({
            id: shp1Id, order_id: `ORD-${randId}1`, origin: `${country} North`, destination: `${country} Hub`,
            status: 'in_transit', carrier: 'Local Express', 
            origin_lat: lat + 2, origin_lng: lng,
            dest_lat: lat, dest_lng: lng,
            current_lat: lat + 1, current_lng: lng, 
            eta: new Date(Date.now() + 86400000).toISOString()
        });
        
        shipments.push({
            id: shp2Id, order_id: `ORD-${randId}2`, origin: `${country} South`, destination: `${country} Hub`,
            status: 'delayed', carrier: 'Global Transit', 
            origin_lat: lat - 2, origin_lng: lng,
            dest_lat: lat, dest_lng: lng,
            current_lat: lat - 1, current_lng: lng, 
            eta: new Date(Date.now() + 86400000 * 3).toISOString()
        });

        // Generate 1 Alert for the delayed shipment
        alerts.push({
            id: `ALT-${prefix}-${randId}`, shipment_id: shp2Id, type: 'delay', severity: 'high',
            message: `Shipment delayed due to local customs inspection in ${country}.`, acked: false, created_at: new Date().toISOString()
        });

        res.json({ data: { success: true, message: `Region ${country} generated successfully.` } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate region' });
    }
});

app.post('/api/custom-route', async (req, res) => {
    const { origin, destination } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: 'Origin and destination are required' });

    try {
        // Fetch coordinates from Nominatim for both locations
        const [originRes, destRes] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`, {
                headers: { 'User-Agent': 'SupplyWatch AI Mock Backend' }
            }),
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, {
                headers: { 'User-Agent': 'SupplyWatch AI Mock Backend' }
            })
        ]);

        const originData = await originRes.json();
        const destData = await destRes.json();
        
        if (!originData || originData.length === 0) return res.status(404).json({ error: `Origin '${origin}' not found` });
        if (!destData || destData.length === 0) return res.status(404).json({ error: `Destination '${destination}' not found` });

        const origin_lat = parseFloat(originData[0].lat);
        const origin_lng = parseFloat(originData[0].lon);
        const dest_lat = parseFloat(destData[0].lat);
        const dest_lng = parseFloat(destData[0].lon);

        const randId = Math.floor(Math.random() * 10000);
        const shpId = `SHP-CST-${randId}`;
        
        // Progress the shipment slightly along the path (e.g. 20% in)
        const current_lat = origin_lat + (dest_lat - origin_lat) * 0.2;
        const current_lng = origin_lng + (dest_lng - origin_lng) * 0.2;

        const newShipment = {
            id: shpId, order_id: `ORD-${randId}`, origin, destination,
            status: 'in_transit', carrier: 'Custom Logistics', 
            origin_lat, origin_lng, dest_lat, dest_lng,
            current_lat, current_lng, 
            eta: new Date(Date.now() + 86400000 * 2).toISOString()
        };

        shipments.push(newShipment);

        // Save to file
        try {
            const saved = fs.existsSync(CUSTOM_ROUTES_FILE) ? JSON.parse(fs.readFileSync(CUSTOM_ROUTES_FILE, 'utf8')) : [];
            saved.push(newShipment);
            fs.writeFileSync(CUSTOM_ROUTES_FILE, JSON.stringify(saved, null, 2));
        } catch (e) {
            console.error('Failed to save custom route:', e);
        }

        res.json({ data: { success: true, message: `Route from ${origin} to ${destination} generated.` } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate custom route' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io
io.of('/live').on('connection', (socket) => {
    console.log('Client connected to live dashboard');
});

// Live Emitter Simulator
const ALERT_CAUSES = [
    'Heavy traffic congestion on national highway',
    'Weather disruption - heavy rainfall ahead',
    'Port congestion causing loading delays',
    'Customs inspection hold at border',
    'Vehicle breakdown - replacement en route',
    'Fuel shortage at transit depot',
    'Driver rest stop exceeding schedule',
    'Road closure due to accident ahead',
];

const REPLAN_ACTIONS = ['expedite_air_freight', 'reroute_via_alternate', 'split_shipment', 'use_backup_carrier'];
const SUPPLIERS = ['Tata Logistics', 'Blue Dart Express', 'DHL Supply Chain', 'FedEx Priority', 'Maersk Direct'];

let alertCooldowns = {}; // prevent spamming same shipment

setInterval(() => {
    shipments.forEach(s => {
        if (s.status === 'in_transit' || s.status === 'delayed') {
            // Move truck position
            s.current_lat += (Math.random() - 0.5) * 0.2;
            s.current_lng += (Math.random() - 0.5) * 0.2;
            io.of('/live').emit('shipment:position', { shipmentId: s.id, lat: s.current_lat, lng: s.current_lng, status: s.status });

            // Auto-generate delay alert (30% chance for delayed, 10% for in_transit, with cooldown)
            const now = Date.now();
            const cooldown = alertCooldowns[s.id] || 0;
            const chance = s.status === 'delayed' ? 0.30 : 0.10;

            if (now - cooldown > 30000 && Math.random() < chance) {
                const predictedDelayMins = s.status === 'delayed'
                    ? 120 + Math.floor(Math.random() * 360)
                    : 30 + Math.floor(Math.random() * 90);

                const cause = ALERT_CAUSES[Math.floor(Math.random() * ALERT_CAUSES.length)];
                const severity = predictedDelayMins > 360 ? 'critical' : predictedDelayMins > 240 ? 'high' : predictedDelayMins > 120 ? 'medium' : 'low';

                // Push delay alert to frontend
                io.of('/live').emit('delay:alert', {
                    shipmentId: s.id,
                    predictedDelayMins,
                    cause: `${cause} for shipment ${s.order_id} (${s.origin} → ${s.destination})`,
                    severity,
                });

                // Also save to server-side alerts array
                const newAlert = {
                    id: `ALT-LIVE-${Date.now()}`,
                    shipment_id: s.id,
                    type: 'delay',
                    severity,
                    message: `${cause} for shipment ${s.order_id} (${s.origin} → ${s.destination})`,
                    acked: false,
                    created_at: new Date().toISOString()
                };
                alerts.push(newAlert);

                // 50% chance to also generate a replan suggestion
                if (Math.random() > 0.5) {
                    const action = REPLAN_ACTIONS[Math.floor(Math.random() * REPLAN_ACTIONS.length)];
                    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
                    const qty = 1000 + Math.floor(Math.random() * 5000);
                    const cost = qty * (10 + Math.random() * 20);

                    io.of('/live').emit('replan:suggestion', {
                        id: `REC-LIVE-${Date.now()}`,
                        alert_id: newAlert.id,
                        sku_id: 'AUTO-REPLAN',
                        action,
                        qty,
                        supplier_name: supplier,
                        estimated_cost: Math.round(cost),
                        status: 'open',
                        urgency: severity,
                        created_at: new Date().toISOString()
                    });
                }

                alertCooldowns[s.id] = now;
            }
        }
    });

    // Push live KPI refresh every cycle
    const activeCount = shipments.filter(s => s.status === 'in_transit' || s.status === 'delayed').length;
    const delayedCount = shipments.filter(s => s.status === 'delayed').length;
    const onTimeRate = activeCount > 0 ? Math.round(((activeCount - delayedCount) / activeCount) * 100 * 10) / 10 : 100;
    io.of('/live').emit('kpi:refresh', {
        onTimeRate,
        avgDelay: 30 + delayedCount * 15 + Math.random() * 10,
        fillRate: 94 + Math.random() * 3,
        openAlerts: alerts.filter(a => !a.acked).length,
        activeShipments: activeCount,
    });
}, 8000);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`✅ Mock Backend running on port ${PORT}`);
});
