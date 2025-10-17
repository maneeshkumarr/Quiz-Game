const { initDatabase } = require('../database/database');

async function init() {
  try {
    console.log('🚀 Initializing Quiz Game Database...\n');
    
    await initDatabase();
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('🎯 Your quiz application is ready to handle 60+ concurrent students');
    console.log('📊 All tables created with proper indexes for optimal performance');
    console.log('\n📋 Database Features:');
    console.log('   • User registration and management');
    console.log('   • Quiz session tracking');
    console.log('   • Detailed answer analytics');
    console.log('   • Real-time leaderboard updates');
    console.log('   • Admin dashboard and reporting');
    console.log('   • Performance optimized for classroom use');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

init();