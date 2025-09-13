import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice Johnson',
        bio: 'Product designer and coffee enthusiast ☕',
        passwordHash: await bcrypt.hash('password123', 12),
        status: 'ONLINE',
        isOnline: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        username: 'bob',
        displayName: 'Bob Smith',
        bio: 'Full-stack developer and tech enthusiast 🚀',
        passwordHash: await bcrypt.hash('password123', 12),
        status: 'ONLINE',
        isOnline: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@example.com' },
      update: {},
      create: {
        email: 'charlie@example.com',
        username: 'charlie',
        displayName: 'Charlie Brown',
        bio: 'DevOps engineer and automation lover 🤖',
        passwordHash: await bcrypt.hash('password123', 12),
        status: 'AWAY',
        isOnline: false,
      },
    }),
    prisma.user.upsert({
      where: { email: 'diana@example.com' },
      update: {},
      create: {
        email: 'diana@example.com',
        username: 'diana',
        displayName: 'Diana Prince',
        bio: 'UX researcher and user advocate 👥',
        passwordHash: await bcrypt.hash('password123', 12),
        status: 'BUSY',
        isOnline: true,
      },
    }),
  ]);

  console.log('✅ Created users:', users.length);

  // Create a group room
  const groupRoom = await prisma.room.create({
    data: {
      name: 'General Discussion',
      description: 'Main channel for team discussions and updates',
      type: 'GROUP',
      isPrivate: false,
      createdBy: users[0].id,
      members: {
        create: [
          { userId: users[0].id, role: 'OWNER' },
          { userId: users[1].id, role: 'ADMIN' },
          { userId: users[2].id, role: 'MEMBER' },
          { userId: users[3].id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Created group room:', groupRoom.name);

  // Create a direct message room
  const directRoom = await prisma.room.create({
    data: {
      type: 'DIRECT',
      isPrivate: true,
      createdBy: users[0].id,
      members: {
        create: [
          { userId: users[0].id, role: 'MEMBER' },
          { userId: users[1].id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Created direct message room');

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        roomId: groupRoom.id,
        senderId: users[0].id,
        content: 'Welcome everyone! 👋 This is our new chat application.',
        type: 'TEXT',
      },
    }),
    prisma.message.create({
      data: {
        roomId: groupRoom.id,
        senderId: users[1].id,
        content: 'Thanks for setting this up! The UI looks amazing 🎨',
        type: 'TEXT',
      },
    }),
    prisma.message.create({
      data: {
        roomId: groupRoom.id,
        senderId: users[2].id,
        content: 'I love the real-time features! Socket.IO is working perfectly ⚡',
        type: 'TEXT',
      },
    }),
    prisma.message.create({
      data: {
        roomId: directRoom.id,
        senderId: users[0].id,
        content: 'Hey Bob! How are you doing?',
        type: 'TEXT',
      },
    }),
    prisma.message.create({
      data: {
        roomId: directRoom.id,
        senderId: users[1].id,
        content: 'Hi Alice! I\'m doing great, thanks for asking. How about you?',
        type: 'TEXT',
      },
    }),
  ]);

  console.log('✅ Created messages:', messages.length);

  // Create some reactions
  await Promise.all([
    prisma.reaction.create({
      data: {
        messageId: messages[0].id,
        userId: users[1].id,
        emoji: '👋',
      },
    }),
    prisma.reaction.create({
      data: {
        messageId: messages[0].id,
        userId: users[2].id,
        emoji: '🎉',
      },
    }),
    prisma.reaction.create({
      data: {
        messageId: messages[1].id,
        userId: users[0].id,
        emoji: '❤️',
      },
    }),
  ]);

  console.log('✅ Created reactions');

  // Create some contacts
  await Promise.all([
    prisma.contact.create({
      data: {
        userId: users[0].id,
        contactId: users[1].id,
        nickname: 'Bob',
      },
    }),
    prisma.contact.create({
      data: {
        userId: users[1].id,
        contactId: users[0].id,
        nickname: 'Alice',
      },
    }),
  ]);

  console.log('✅ Created contacts');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📝 Sample accounts created:');
  console.log('Email: alice@example.com | Password: password123');
  console.log('Email: bob@example.com | Password: password123');
  console.log('Email: charlie@example.com | Password: password123');
  console.log('Email: diana@example.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
