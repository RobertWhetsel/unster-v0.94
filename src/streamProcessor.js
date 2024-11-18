const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // Check if this is a scheduled event
        if (event.source === 'aws.events') {
            console.log('Processing scheduled event:', JSON.stringify(event, null, 2));
            return await handleScheduledEvent();
        }

        // Process DynamoDB Stream events
        console.log('Processing DynamoDB Stream records:', JSON.stringify(event, null, 2));

        for (const record of event.Records) {
            // Get the type of event (INSERT, MODIFY, REMOVE)
            const eventType = record.eventName;
            
            // Get the new and old images of the record
            const oldImage = record.dynamodb.OldImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage) : null;
            const newImage = record.dynamodb.NewImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) : null;

            console.log(`Processing ${eventType} event:`);
            console.log('Old Image:', oldImage);
            console.log('New Image:', newImage);

            // Handle different types of events
            switch (eventType) {
                case 'INSERT':
                    await handleInsert(newImage);
                    break;
                case 'MODIFY':
                    await handleModify(oldImage, newImage);
                    break;
                case 'REMOVE':
                    await handleRemove(oldImage);
                    break;
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Processing completed successfully' })
        };
    } catch (error) {
        console.error('Error processing event:', error);
        throw error;
    }
};

async function handleScheduledEvent() {
    try {
        // Query the DynamoDB table for records that need periodic processing
        const tableName = process.env.DYNAMODB_TABLE;
        const currentTime = Date.now();
        const fiveMinutesAgo = currentTime - (5 * 60 * 1000);

        const params = {
            TableName: tableName,
            IndexName: 'TimestampIndex',
            KeyConditionExpression: 'blockchainKey = :bKey AND #ts >= :timestamp',
            ExpressionAttributeNames: {
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':bKey': 'PENDING',
                ':timestamp': fiveMinutesAgo
            }
        };

        const result = await dynamodb.query(params).promise();
        console.log('Found records for processing:', result.Items.length);

        // Process each record that needs attention
        for (const item of result.Items) {
            await processScheduledItem(item);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Scheduled processing completed successfully',
                processedCount: result.Items.length
            })
        };
    } catch (error) {
        console.error('Error in scheduled processing:', error);
        throw error;
    }
}

async function processScheduledItem(item) {
    // Add your scheduled processing logic here
    console.log('Processing scheduled item:', item.id);
    // Example: Update item status, trigger external processes, etc.
}

async function handleInsert(newImage) {
    // Handle new record insertion
    console.log('Handling INSERT event for record:', newImage.id);
    // Add your business logic here
    // For example: trigger notifications, update analytics, sync with external systems
}

async function handleModify(oldImage, newImage) {
    // Handle record modification
    console.log('Handling MODIFY event for record:', newImage.id);
    // Add your business logic here
    // For example: track changes, update cached data, trigger workflows
}

async function handleRemove(oldImage) {
    // Handle record deletion
    console.log('Handling REMOVE event for record:', oldImage.id);
    // Add your business logic here
    // For example: cleanup related data, update indexes, archive data
}
