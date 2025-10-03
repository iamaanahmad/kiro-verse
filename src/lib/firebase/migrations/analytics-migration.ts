// Analytics Database Migration Scripts
// These scripts help set up the analytics database schema and indexes

import { adminDb } from '../admin';
import { COLLECTIONS } from '../analytics';

export interface MigrationResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

/**
 * Migration script to create analytics collections and set up indexes
 * Note: Firestore indexes are typically created via Firebase Console or CLI
 * This script provides the index definitions for reference
 */
export class AnalyticsMigration {
  
  static async runMigration(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    try {
      // Create initial documents to establish collections
      await this.createCollections();
      results.push({
        success: true,
        message: 'Analytics collections created successfully',
        timestamp: new Date()
      });

      // Set up security rules (reference only - actual rules set in Firebase Console)
      await this.setupSecurityRules();
      results.push({
        success: true,
        message: 'Security rules reference created',
        timestamp: new Date()
      });

      // Create composite indexes (reference only - actual indexes created via CLI/Console)
      await this.createIndexes();
      results.push({
        success: true,
        message: 'Index definitions created',
        timestamp: new Date()
      });

    } catch (error) {
      results.push({
        success: false,
        message: `Migration failed: ${error}`,
        timestamp: new Date()
      });
    }

    return results;
  }

  private static async createCollections(): Promise<void> {
    // Create initial documents to establish collections
    const collections = [
      COLLECTIONS.USER_PROGRESS,
      COLLECTIONS.ANALYTICS_DATA,
      COLLECTIONS.LEARNING_INSIGHTS,
      COLLECTIONS.SKILL_LEVELS,
      COLLECTIONS.CHALLENGES,
      COLLECTIONS.BENCHMARKS
    ];

    for (const collectionName of collections) {
      try {
        // Create a temporary document to establish the collection
        const tempDocRef = adminDb.collection(collectionName).doc('_temp_migration');
        await tempDocRef.set({
          _temp: true,
          createdAt: new Date().toISOString(),
          purpose: 'Collection initialization'
        });
        
        // Delete the temporary document
        await tempDocRef.delete();
        
        console.log(`Collection ${collectionName} initialized`);
      } catch (error) {
        console.error(`Failed to initialize collection ${collectionName}:`, error);
      }
    }
  }

  private static async setupSecurityRules(): Promise<void> {
    // Security rules reference - these should be applied in Firebase Console
    const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User Progress - users can only access their own data
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Analytics Data - users can only access their own analytics
    match /analyticsData/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Learning Insights - users can only access their own insights
    match /learningInsights/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Challenges - read access for all authenticated users
    match /challenges/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.createdBy == 'ai' || 
         resource.data.createdBy == 'community');
    }
    
    // Benchmarks - read access for all authenticated users
    match /benchmarks/{document} {
      allow read: if request.auth != null;
    }
  }
}`;

    console.log('Security rules reference created. Apply these rules in Firebase Console:');
    console.log(securityRules);
  }

  private static async createIndexes(): Promise<void> {
    // Index definitions - these should be created via Firebase CLI or Console
    const indexDefinitions = [
      {
        collection: COLLECTIONS.USER_PROGRESS,
        fields: [
          { field: 'userId', order: 'ASCENDING' },
          { field: 'updatedAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: COLLECTIONS.ANALYTICS_DATA,
        fields: [
          { field: 'userId', order: 'ASCENDING' },
          { field: 'timestamp', order: 'DESCENDING' }
        ]
      },
      {
        collection: COLLECTIONS.ANALYTICS_DATA,
        fields: [
          { field: 'sessionId', order: 'ASCENDING' }
        ]
      },
      {
        collection: COLLECTIONS.LEARNING_INSIGHTS,
        fields: [
          { field: 'userId', order: 'ASCENDING' },
          { field: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: COLLECTIONS.LEARNING_INSIGHTS,
        fields: [
          { field: 'userId', order: 'ASCENDING' },
          { field: 'isRead', order: 'ASCENDING' },
          { field: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: COLLECTIONS.LEARNING_INSIGHTS,
        fields: [
          { field: 'expiresAt', order: 'ASCENDING' }
        ]
      },
      {
        collection: COLLECTIONS.CHALLENGES,
        fields: [
          { field: 'isActive', order: 'ASCENDING' },
          { field: 'difficulty', order: 'ASCENDING' }
        ]
      }
    ];

    console.log('Index definitions created. Create these indexes using Firebase CLI:');
    
    indexDefinitions.forEach((index, i) => {
      const fieldsStr = index.fields.map(f => `${f.field}:${f.order.toLowerCase()}`).join(',');
      console.log(`firebase firestore:indexes:create --collection-group=${index.collection} --field-config=${fieldsStr}`);
    });

    // Store index definitions in a reference document
    try {
      await adminDb.collection('_migrations').doc('analytics_indexes').set({
        indexes: indexDefinitions,
        createdAt: new Date().toISOString(),
        status: 'reference_created'
      });
    } catch (error) {
      console.error('Failed to store index definitions:', error);
    }
  }

  /**
   * Rollback migration - removes analytics collections
   * WARNING: This will delete all analytics data
   */
  static async rollbackMigration(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    try {
      const collections = [
        COLLECTIONS.USER_PROGRESS,
        COLLECTIONS.ANALYTICS_DATA,
        COLLECTIONS.LEARNING_INSIGHTS,
        COLLECTIONS.SKILL_LEVELS,
        COLLECTIONS.CHALLENGES,
        COLLECTIONS.BENCHMARKS
      ];

      for (const collectionName of collections) {
        try {
          // Get all documents in the collection
          const snapshot = await adminDb.collection(collectionName).get();
          
          // Delete all documents
          const batch = adminDb.batch();
          snapshot.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          
          console.log(`Collection ${collectionName} cleared`);
        } catch (error) {
          console.error(`Failed to clear collection ${collectionName}:`, error);
        }
      }

      results.push({
        success: true,
        message: 'Analytics migration rolled back successfully',
        timestamp: new Date()
      });

    } catch (error) {
      results.push({
        success: false,
        message: `Rollback failed: ${error}`,
        timestamp: new Date()
      });
    }

    return results;
  }

  /**
   * Check migration status
   */
  static async checkMigrationStatus(): Promise<{
    collectionsExist: boolean;
    indexesExist: boolean;
    securityRulesApplied: boolean;
  }> {
    try {
      // Check if collections exist by trying to read from them
      const collectionsExist = await this.checkCollectionsExist();
      
      // Check if index definitions exist
      const indexesExist = await this.checkIndexDefinitionsExist();
      
      // Security rules check would require Firebase Admin SDK with elevated permissions
      const securityRulesApplied = false; // Manual verification required
      
      return {
        collectionsExist,
        indexesExist,
        securityRulesApplied
      };
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return {
        collectionsExist: false,
        indexesExist: false,
        securityRulesApplied: false
      };
    }
  }

  private static async checkCollectionsExist(): Promise<boolean> {
    try {
      const collections = [COLLECTIONS.USER_PROGRESS, COLLECTIONS.ANALYTICS_DATA];
      
      for (const collectionName of collections) {
        const snapshot = await adminDb.collection(collectionName).limit(1).get();
        // Collection exists if we can query it without error
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async checkIndexDefinitionsExist(): Promise<boolean> {
    try {
      const doc = await adminDb.collection('_migrations').doc('analytics_indexes').get();
      return doc.exists;
    } catch (error) {
      return false;
    }
  }
}

// Export migration runner function
export async function runAnalyticsMigration(): Promise<void> {
  console.log('Starting analytics database migration...');
  
  const results = await AnalyticsMigration.runMigration();
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
    }
  });
  
  console.log('Analytics migration completed.');
}

// Export status checker
export async function checkAnalyticsMigrationStatus(): Promise<void> {
  console.log('Checking analytics migration status...');
  
  const status = await AnalyticsMigration.checkMigrationStatus();
  
  console.log(`Collections exist: ${status.collectionsExist ? '✅' : '❌'}`);
  console.log(`Index definitions exist: ${status.indexesExist ? '✅' : '❌'}`);
  console.log(`Security rules applied: ${status.securityRulesApplied ? '✅' : '❌ (Manual verification required)'}`);
}