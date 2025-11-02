import { PubSub } from '@google-cloud/pubsub';

export interface RatingEvent {
    user_id: number;
    recipe_id: number;
    rating: number;
}

interface GoogleCredentials {
    type: string;
    project_id?: string;
    private_key_id?: string;
    private_key?: string;
    client_email?: string;
    client_id?: string;
    auth_uri?: string;
    token_uri?: string;
    auth_provider_x509_cert_url?: string;
    client_x509_cert_url?: string;
    universe_domain?: string;
}

interface PubSubConfig {
    projectId?: string;
    credentials?: GoogleCredentials;
    keyFilename?: string;
}

export class PubSubService {
    private pubsub: PubSub;
    private topicName: string;

    constructor() {
        const pubSubConfig: PubSubConfig = {
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        };
        
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            pubSubConfig.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) as GoogleCredentials;
        }
        
        this.pubsub = new PubSub(pubSubConfig);
        this.topicName = process.env.PUBSUB_TOPIC_NAME || 'user-rating-events';
        
        console.log(`PubSub initialized with project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}, topic: ${this.topicName}`);
    }

    async publishRatingEvent(event: RatingEvent): Promise<void> {
        try {
            const topic = this.pubsub.topic(this.topicName);
            const messageData = Buffer.from(JSON.stringify(event));
            
            await topic.publishMessage({
                data: messageData,
                attributes: {
                    eventType: 'rating',
                    timestamp: new Date().toISOString()
                }
            });

            console.log(`Published rating event for user ${event.user_id}, recipe ${event.recipe_id}`);
        } catch (error) {
            console.error('Failed to publish rating event:', error);
            throw error;
        }
    }
}