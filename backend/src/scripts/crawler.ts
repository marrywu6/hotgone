import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { crawlEvents } from '../services/crawler';

dotenv.config();

async function runCrawler() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    console.log('Starting crawler...');
    await crawlEvents();
    console.log('Crawler completed successfully');
    
  } catch (error) {
    console.error('Crawler failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runCrawler();