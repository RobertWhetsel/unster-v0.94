# Unster - FlexNetGX unDatabase Implementation

A scalable serverless AWS infrastructure deployment for the FlexNetGX Unster unDatabase using AWS CloudFormation.

## Architecture Overview

This project implements a modern serverless architecture with the following components:

- **API Layer**: API Gateway with CORS support
- **Compute**: AWS Lambda functions for request handling and stream processing
- **Database**: Amazon DynamoDB with streams and GSI for timestamp-based queries
- **Frontend Hosting**: S3 + CloudFront with SSL support
- **Networking**: Custom VPC with public subnets across multiple AZs
- **Monitoring**: CloudWatch logging integration
- **Scheduling**: EventBridge for periodic processing

## Infrastructure Diagram

```
                                    ┌─────────────┐
                                    │  CloudFront │
                                    └──────┬──────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     │                                           │
               ┌─────┴─────┐                             ┌───────┴───────┐
               │    S3     │                             │  API Gateway  │
               │ (Frontend)│                             └───────┬───────┘
               └───────────┘                                     │
                                                         ┌──────┴──────┐
                                                         │   Lambda    │
                                                         └──────┬──────┘
                                                                │
                                                         ┌──────┴──────┐
                                                         │  DynamoDB   │──┐
                                                         └─────────────┘  │
                                                                         │
                                                                  ┌──────┴──────┐
                                                                  │Stream Lambda │
                                                                  └─────────────┘
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Domain name and SSL certificate (ACM) for HTTPS support

## Deployment Parameters

The template accepts the following parameters:

- `Environment`: Deployment environment (dev/staging/prod)
- `DomainName`: Domain name for the application
- `CertificateArn`: ARN of the SSL certificate

## Resource Configuration

### DynamoDB Table Schema
- Primary Key: `id` (String)
- Sort Key: `blockchainKey` (String)
- GSI: TimestampIndex
  - Partition Key: `blockchainKey`
  - Sort Key: `timestamp`
- Stream: Enabled with NEW_AND_OLD_IMAGES

### Lambda Functions
- **Main Function**:
  - Runtime: Node.js 18.x
  - Memory: 512MB
  - Timeout: 30 seconds
  - Event Source: API Gateway

- **Stream Processor**:
  - Runtime: Node.js 18.x
  - Memory: 512MB
  - Timeout: 30 seconds
  - Event Sources: 
    - DynamoDB Stream
    - EventBridge (5-minute schedule)

### Networking
- VPC CIDR: 10.0.0.0/16
- Public Subnets:
  - us-east-1a: 10.0.1.0/24
  - us-east-1b: 10.0.2.0/24

## Deployment Instructions

1. Ensure you have the required parameters:
   ```bash
   export DOMAIN_NAME=your-domain.com
   export CERT_ARN=arn:aws:acm:...
   ```

2. Deploy the stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name unster-stack \
     --template-body file://unster.yaml \
     --parameters \
       ParameterKey=Environment,ParameterValue=dev \
       ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME \
       ParameterKey=CertificateArn,ParameterValue=$CERT_ARN \
     --capabilities CAPABILITY_IAM
   ```

## Security Features

- HTTPS enforced via CloudFront
- IAM roles with least privilege principle
- VPC with proper subnet isolation
- CloudWatch logs retention set to 30 days
- API Gateway with CORS configuration
- Lambda execution roles with minimal required permissions

## Outputs

The stack provides the following outputs:
- VPC ID
- API Gateway Endpoint
- Lambda Function ARNs
- CloudFront Distribution Domain
- DynamoDB Table Name and Stream ARN

## Monitoring

- Monitor CloudWatch logs at `/aws/lambda/unster`
- DynamoDB is configured with on-demand capacity for automatic scaling
- Stream processor runs on a 5-minute schedule for periodic data processing
- API Gateway metrics available in CloudWatch
