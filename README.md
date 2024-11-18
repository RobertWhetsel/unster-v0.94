# Unster - FlexNetGX unDatabase Implementation

A scalable AWS infrastructure deployment for the FlexNetGX Unster unDatabase using AWS CloudFormation.

## Architecture Overview

This project implements a modern cloud architecture with the following components:

- **Container Orchestration**: Amazon ECS with Fargate for serverless container management
- **Database**: Amazon DynamoDB with GSI for timestamp-based queries
- **Frontend Hosting**: S3 + CloudFront with SSL support
- **Container Registry**: Amazon ECR with automatic image scanning
- **Networking**: Custom VPC with public subnets across multiple AZs
- **Monitoring**: CloudWatch logging integration

## Infrastructure Diagram

```
                                    ┌─────────────┐
                                    │  CloudFront │
                                    └──────┬──────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     │                                           │
               ┌─────┴─────┐                             ┌───────┴───────┐
               │    S3     │                             │  ECS Fargate  │
               │ (Frontend)│                             │  (Backend)    │
               └───────────┘                             └───────┬───────┘
                                                               │
                                                        ┌──────┴──────┐
                                                        │  DynamoDB   │
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

### Networking
- VPC CIDR: 10.0.0.0/16
- Public Subnets:
  - us-east-1a: 10.0.1.0/24
  - us-east-1b: 10.0.2.0/24

### Container Configuration
- CPU: 256 units
- Memory: 512 MB
- Port: 8080

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

- ECR repository configured with automatic image scanning
- HTTPS enforced via CloudFront
- IAM roles with least privilege principle
- VPC with proper subnet isolation
- CloudWatch logs retention set to 30 days

## Outputs

The stack provides the following outputs:
- VPC ID
- ECS Cluster ARN
- ECR Repository URI
- CloudFront Distribution Domain
- DynamoDB Table Name

## Maintenance

- Monitor CloudWatch logs at `/aws/ecs/unster`
- ECR images are immutable to ensure version control
- DynamoDB is configured with on-demand capacity for automatic scaling
