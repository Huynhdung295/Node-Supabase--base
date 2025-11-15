import { supabaseAdmin } from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const seedUsers = async () => {
  console.log('🌱 Seeding database...');

  try {
    // Tạo admin user
    const { data: adminAuth, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'admin123',
      email_confirm: true
    });

    if (adminAuthError) {
      console.error('Error creating admin:', adminAuthError.message);
    } else {
      await supabaseAdmin.from('profiles').insert({
        id: adminAuth.user.id,
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        tier_vip: 'diamond'
      });
      console.log('✅ Admin user created');
    }

    // Tạo regular user
    const { data: userAuth, error: userAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'user@example.com',
      password: 'user123',
      email_confirm: true
    });

    if (userAuthError) {
      console.error('Error creating user:', userAuthError.message);
    } else {
      await supabaseAdmin.from('profiles').insert({
        id: userAuth.user.id,
        email: 'user@example.com',
        full_name: 'Regular User',
        role: 'user',
        tier_vip: 'silver'
      });
      console.log('✅ Regular user created');
    }

    // Tạo affiliate user
    const { data: affAuth, error: affAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'aff@example.com',
      password: 'aff123',
      email_confirm: true
    });

    if (affAuthError) {
      console.error('Error creating affiliate:', affAuthError.message);
    } else {
      await supabaseAdmin.from('profiles').insert({
        id: affAuth.user.id,
        email: 'aff@example.com',
        full_name: 'Affiliate User',
        role: 'aff',
        tier_vip: 'gold'
      });
      console.log('✅ Affiliate user created');
    }

    console.log('\n🎉 Seeding completed!');
    console.log('\nTest accounts:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
    console.log('Affiliate: aff@example.com / aff123');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
};

seedUsers();
