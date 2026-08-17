pipeline {

    agent any

    options {
        timestamps()
    }

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '630434208583'
        IMAGE_NAME = 'zomato-kastro'
        ECR_REPO = '630434208583.dkr.ecr.us-east-1.amazonaws.com/zomato-kastro'
        EKS_CLUSTER = 'zomato-kastro-eks-v1'
    }

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'master',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/Kalyaniyalla5057/DevOps-Project-Zomato-Kastro.git'
            }
        }

        stage('Check Versions') {
            steps {
                sh '''
                    echo "======================================"
                    echo "JAVA VERSION"
                    echo "======================================"
                    java -version

                    echo "======================================"
                    echo "NODE VERSION"
                    echo "======================================"
                    node -v

                    echo "======================================"
                    echo "NPM VERSION"
                    echo "======================================"
                    npm -v

                    echo "======================================"
                    echo "DOCKER VERSION"
                    echo "======================================"
                    docker --version

                    echo "======================================"
                    echo "AWS CLI VERSION"
                    echo "======================================"
                    aws --version

                    echo "======================================"
                    echo "KUBECTL VERSION"
                    echo "======================================"
                    kubectl version --client

                    echo "======================================"
                    echo "EKSCTL VERSION"
                    echo "======================================"
                    eksctl version

                    echo "======================================"
                    echo "AWS IDENTITY"
                    echo "======================================"
                    aws sts get-caller-identity
                '''
            }
        }

        stage('Check AWS Resources') {
            steps {
                sh '''
                    echo "Checking ECR repository..."

                    aws ecr describe-repositories \
                    --repository-names ${IMAGE_NAME} \
                    --region ${AWS_REGION}

                    echo "Checking EKS cluster..."

                    aws eks describe-cluster \
                    --name ${EKS_CLUSTER} \
                    --region ${AWS_REGION} \
                    --query 'cluster.status' \
                    --output text
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {

                    def scannerHome = tool 'sonar-scanner'

                    withSonarQubeEnv('sonarqube') {

                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=zomato-kastro \
                            -Dsonar.projectName=zomato-kastro \
                            -Dsonar.sources=src
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                echo 'Skipping Quality Gate'
            }
        }

        stage('OWASP Dependency Check') {
            steps {
                sh '''
                    mkdir -p dependency-check-report

                    /opt/dependency-check-tool/bin/dependency-check.sh \
                    --project zomato-kastro \
                    --scan . \
                    --format XML \
                    --out dependency-check-report
                '''
            }
        }

        stage('Publish OWASP Report') {
            steps {
                dependencyCheckPublisher(
                    pattern: 'dependency-check-report/dependency-check-report.xml',
                    skipNoReportFiles: true
                )
            }
        }

        stage('Trivy File Scan') {
            steps {
                sh '''
                    trivy fs . --no-progress
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                    -t ${IMAGE_NAME}:latest \
                    .
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image \
                    ${IMAGE_NAME}:latest \
                    --no-progress
                '''
            }
        }

        stage('Login to AWS ECR') {
            steps {
                sh '''
                    aws ecr get-login-password \
                    --region ${AWS_REGION} | \
                    docker login \
                    --username AWS \
                    --password-stdin \
                    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                '''
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh '''
                    docker tag \
                    ${IMAGE_NAME}:latest \
                    ${ECR_REPO}:latest
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                sh '''
                    docker push \
                    ${ECR_REPO}:latest
                '''
            }
        }

        stage('Verify ECR Image') {
            steps {
                sh '''
                    aws ecr describe-images \
                    --repository-name ${IMAGE_NAME} \
                    --image-ids imageTag=latest \
                    --region ${AWS_REGION}
                '''
            }
        }

        stage('Configure EKS') {
            steps {
                sh '''
                    aws eks update-kubeconfig \
                    --region ${AWS_REGION} \
                    --name ${EKS_CLUSTER}
                '''
            }
        }

        stage('Verify Kubernetes Connection') {
            steps {
                sh '''
                    kubectl cluster-info

                    echo "======================================"
                    echo "KUBERNETES NODES"
                    echo "======================================"

                    kubectl get nodes
                '''
            }
        }

        stage('Deploy Application to EKS') {
            steps {
                sh '''
                    echo "Applying Zomato deployment..."

                    kubectl apply \
                    -f Kubernetes/deployment.yaml

                    echo "Applying Zomato service..."

                    kubectl apply \
                    -f Kubernetes/service.yaml
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "======================================"
                    echo "DEPLOYMENT"
                    echo "======================================"

                    kubectl get deployment zomato

                    echo "======================================"
                    echo "PODS"
                    echo "======================================"

                    kubectl get pods -o wide

                    echo "======================================"
                    echo "ROLLOUT"
                    echo "======================================"

                    kubectl rollout status \
                    deployment/zomato \
                    --timeout=5m

                    echo "======================================"
                    echo "SERVICE"
                    echo "======================================"

                    kubectl get svc zomato
                '''
            }
        }

        stage('Get Application URL') {
            steps {
                sh '''
                    echo "======================================"
                    echo "APPLICATION LOAD BALANCER"
                    echo "======================================"

                    kubectl get svc zomato \
                    -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

                    echo ""
                '''
            }
        }
    }

    post {

        always {
            echo "Build result: ${currentBuild.currentResult}"
        }

        success {
            echo "======================================"
            echo "PIPELINE SUCCESS"
            echo "======================================"
            echo "Zomato Kastro application deployed successfully to EKS."
        }

        failure {
            echo "======================================"
            echo "PIPELINE FAILED"
            echo "======================================"
            echo "Check the failed stage in Console Output."
        }
    }
}
