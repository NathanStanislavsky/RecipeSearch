import { PubSub } from '@google-cloud/pubsub';

export interface RatingEvent {
    user_id: number;
    recipe_id: number;
    rating: number;
}

export class PubSubService {
    private pubsub: PubSub;
    private topicName: string;

    constructor() {
        this.pubsub = new PubSub({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || './gcs-credentials.json'
        });
        this.topicName = process.env.PUBSUB_TOPIC_NAME || 'rating-events';
    }

    async publishRatingEvent(event: RatingEvent) {
        try {
            const topic = this.pubsub.topic(this.topicName);
            const messageData = Buffer.from(JSON.stringify(event))
            
            await topic.publishMessage({
                data: messageData,
                attributes: {
                    eventType: 'rating',
                    timestamp: new Date().toISOString()
                }
            })

            console.log(`Published rating event for user ${event.user_id}, recipe ${event.recipe_id}`);
        } catch (error) {
            console.error('Failed to publish rating event:', error);
            throw error;
        }
    }
}