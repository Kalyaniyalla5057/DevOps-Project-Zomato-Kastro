pipeline {

    agent any

    environment {
        AWS_REGION   = 'us-east-1'
        ECR_REPO     = 'zomato-kastro'
        IMAGE_NAME   = 'zomato-kastro'
        CLUSTER_NAME = 'zomato-kastro-eks-cluster'
        DEPLOYMENT   = 'zomato'
        SERVICE      = 'zomato'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                    set -e

                    echo "===== JAVA ====="
                    java -version

                    echo "===== NODE ====="
                    node -v

                    echo "===== NPM ====="
                    npm -v

                    echo "===== DOCKER ====="
                    docker --version

                    echo "===== AWS ====="
                    aws --version

                    echo "===== KUBECTL ====="
                    kubectl version --client
                '''
            }
        }

        stage('Check AWS Access') {
            steps {
                sh '''
                    set -e

                    echo "===== AWS IDENTITY ====="
                    aws sts get-caller-identity

                    echo "===== EKS CLUSTER ====="
                    aws eks describe-cluster \
                        --name "$CLUSTER_NAME" \
                        --region "$AWS_REGION" \
                        --query 'cluster.status' \
                        --output text

                    echo "===== ECR REPOSITORY ====="
                    aws ecr describe-repositories \
                        --repository-names "$ECR_REPO" \
                        --region "$AWS_REGION" \
                        --query 'repositories[0].repositoryUri' \
                        --output text
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -e
                    npm install
                '''
            }
        }

        stage('Build Application') {
            steps {
                sh '''
                    set -e
                    npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -e

                    docker build \
                        -t "$IMAGE_NAME:latest" .
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    set -e

                    ACCOUNT_ID=$(aws sts get-caller-identity \
                        --query Account \
                        --output text)

                    ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

                    echo "ECR URI: $ECR_URI"

                    aws ecr get-login-password \
                        --region "$AWS_REGION" | \
                    docker login \
                        --username AWS \
                        --password-stdin "$ECR_URI"
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                sh '''
                    set -e

                    ACCOUNT_ID=$(aws sts get-caller-identity \
                        --query Account \
                        --output text)

                    ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

                    docker tag \
                        "$IMAGE_NAME:latest" \
                        "$ECR_URI:latest"

                    docker push "$ECR_URI:latest"
                '''
            }
        }

        stage('Configure EKS') {
            steps {
                sh '''
                    set -e

                    aws eks update-kubeconfig \
                        --region "$AWS_REGION" \
                        --name "$CLUSTER_NAME"

                    kubectl get nodes
                '''
            }
        }

        stage('Deploy to EKS') {
    steps {
        sh '''
            set -e

            ACCOUNT_ID=$(aws sts get-caller-identity \
                --query Account \
                --output text)

            ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

            echo "Updating existing Zomato deployment..."

            kubectl set image deployment/"$DEPLOYMENT" \
                zomato="$ECR_URI:latest"

            kubectl rollout restart deployment/"$DEPLOYMENT"

            kubectl rollout status \
                deployment/"$DEPLOYMENT" \
                --timeout=5m

            echo "Deployment completed successfully"
        '''
    }
}

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e

                    echo "===== DEPLOYMENT ====="
                    kubectl get deployment "$DEPLOYMENT"

                    echo "===== PODS ====="
                    kubectl get pods \
                        -l app=zomato \
                        -o wide

                    echo "===== SERVICE ====="
                    kubectl get svc "$SERVICE"

                    echo "===== LOAD BALANCER ====="
                    kubectl get svc "$SERVICE" \
                        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

                    echo
                '''
            }
        }
    }

    post {

        success {
            echo '''
========================================
 ZOMATO-KASTRO PIPELINE SUCCESSFUL
========================================
'''
        }

        failure {
            echo '''
========================================
 ZOMATO-KASTRO PIPELINE FAILED
========================================
'''
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}
