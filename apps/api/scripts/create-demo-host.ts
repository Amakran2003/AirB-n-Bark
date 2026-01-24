import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function setup() {
    // Créer ou récupérer un host
    let host = await prisma.user.findUnique({ where: { email: 'demo-host@airbnbark.com' } });
    
    if (!host) {
        host = await prisma.user.create({
            data: {
                email: 'demo-host@airbnbark.com',
                name: 'Demo Host',
                password: await bcrypt.hash('password123', 10),
                isHost: true,
                isVerified: true,
            }
        });
        console.log('✅ Host créé:', host.id);
    } else {
        console.log('✅ Host existant:', host.id);
    }
    
    // Générer un token
    const secret = process.env.JWT_SECRET || 'airbonbark-dev-secret-key-2026-x7k9m2p4q8r1s5t3';
    console.log('🔐 Using secret:', secret.substring(0, 10) + '...');
    
    const token = jwt.sign(
        { userId: host.id, email: host.email, role: 'user', isHost: true },
        secret,
        { expiresIn: '24h' }
    );
    
    console.log('🔑 Token:', token);
    await prisma.$disconnect();
}

setup();
