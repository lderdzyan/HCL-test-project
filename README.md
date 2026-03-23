# HCL-test-project

This project provides a complete infrastructure and deployment setup for **Frontend**, **Backend**, and **Database** services using **Terraform** and automated **GitHub Actions pipelines**.

The focus of this repository is **infrastructure provisioning and deployment on AWS**, not application code.

---

## 📁 Project Structure

```
├── .github/workflows
│ ├── frontend-build.yaml
│ ├── frontend-deploy.yaml
│ ├── backend-build.yaml
│ ├── backend-deploy.yaml
│ ├── database-deploy.yaml
│ ├── *-destroy.yaml
│ ├── npm-audit.yaml
│ └── pnpm-audit.yaml
│
├── code
│ ├── backend/code/
│ └── frontend/code/
│
├── deployments
│ ├── backend/
│ ├── database/
│ └── frontend/
│
├── .gitignore
└── README.md
```
## Overview

This repository is designed to:

- Provision infrastructure on AWS using **Terraform**
- Deploy **Frontend**, **Backend**, and **Database** independently
- Automate CI/CD using **GitHub Actions**
- Maintain separate deployment logic per component
- Enable safe and repeatable deployments across environments

---

##  Technologies Used

- **Terraform** – Infrastructure as Code
- **AWS** – Cloud provider (S3, CloudFront, Route53, etc.)
- **GitHub Actions** – CI/CD pipelines
- **Node.js / pnpm / npm** – Build tools (frontend/backend)

---

##  Infrastructure Design

Each component has its own Terraform configuration:

| Component   | Description |
|------------|------------|
| Frontend   | Static assets hosted on S3 + served via CloudFront |
| Backend    | API service deployed to AWS infrastructure |
| Database   | Managed database resources (e.g., RDS, DynamoDB) |

Infrastructure is split into:

```
deployments/
├── frontend/
├── backend/
└── database/
```

Each directory:

- Has its own Terraform state
- Can be deployed independently
- Uses remote state stored in S3

---

##  CI/CD Workflows

Located in:

```
.github/workflows/
```
### Build Pipelines

- `frontend-build.yaml`
- `backend-build.yaml`

Responsible for:

- Installing dependencies
- Running builds
- Running audits (npm/pnpm)

---

### Deployment Pipelines

- `frontend-deploy.yaml`
- `backend-deploy.yaml`
- `database-deploy.yaml`

Responsible for:

- Initializing Terraform
- Applying infrastructure changes
- Deploying services to AWS

---

### Destroy Pipelines

- `*-destroy.yaml`

Used to:

- Tear down infrastructure safely
- Clean environments when needed

---

### Security Audits

- `npm-audit.yaml`
- `pnpm-audit.yaml`

Ensure dependency vulnerabilities are detected early.

---

## Configuration & Secrets

Sensitive values are stored in **GitHub Secrets**, such as:

- AWS credentials
- Terraform state bucket configuration
- Environment variables (domain, region, etc.)

Terraform variables are passed using environment variables:

Example:

```
TF_VAR_domain
TF_VAR_environment
TF_VAR_aws_region
```
# 🗄️ Terraform State Management

Remote state is stored in AWS S3.

Backend configuration is injected during CI:

```bash
terraform init \
  -backend-config="bucket=..." \
  -backend-config="key=..." \
  -backend-config="region=..."
```
Each deployment (frontend/backend/database) maintains its own state.

##  Deployment Flow

1. Merge code to dev branch
2. GitHub Actions triggers pipeline
3. Build step compiles application (if applicable)
4. Terraform initializes with remote backend
5. Infrastructure is applied to AWS
6. Services are deployed and updated

---

##  Environments

The project supports multiple environments (e.g., dev, stage, prod) using:

- Terraform variables
- Dynamic backend keys
- GitHub Secrets

---

##  Notes

- Application code is minimal and not the focus of this repository
- Infrastructure and deployment automation are the primary goals
- Each service is loosely coupled and independently deployable

---

##  Best Practices Followed

- Infrastructure as Code (IaC)
- Separation of concerns (frontend/backend/database)
- Remote state management
- CI/CD automation
- Secret management via GitHub

---

##  Future Improvements

- Add environment-specific workflows
- Introduce Terraform modules for reuse
- Add monitoring and alerting
- Improve rollback strategies

---

##  Summary

This project demonstrates a scalable, production-ready approach to:

- Managing infrastructure with Terraform  
- Automating deployments with GitHub Actions  
- Deploying full-stack applications on AWS