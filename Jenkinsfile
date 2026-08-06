pipeline {

    agent any
     
    options {
    timestamps()
}

    tools {
        jdk 'java21'
        nodejs 'node20'
    }

    environment {
        AWS_REGION = 'ap-south-1'
        IMAGE_NAME = 'zomato-kastro'
        AWS_ACCOUNT_ID = '267673636065'
        ECR_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/zomato-kastro"
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
                java -version
                node -v
                npm -v
                docker --version
                kubectl version --client
                eksctl version
                trivy --version
                '''
            }
        }


        stage('Install Dependencies') {
            steps {
                sh 'npm install'
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
                echo "Skipping Quality Gate"
            }
        }


        stage('OWASP Dependency Check') {

    steps {

        sh '''
        dependency-check.sh \
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
                docker build -t ${IMAGE_NAME}:latest .
                '''

            }
        }


        stage('Trivy Image Scan') {
            steps {

                sh '''
                trivy image ${IMAGE_NAME}:latest --no-progress
                '''

            }
        }


        stage('Login to AWS ECR') {

            steps {

                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {

                    sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login \
                    --username AWS \
                    --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    '''

                }

            }

        }


        stage('Verify ECR Repository') {

            steps {

                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {

                    sh '''
                    aws ecr describe-repositories \
                    --repository-names zomato-kastro \
                    --region ${AWS_REGION}
                    '''

                }

            }

        }


        stage('Tag Docker Image') {

            steps {

                sh '''
                docker tag ${IMAGE_NAME}:latest ${ECR_REPO}:latest
                '''

            }

        }


        stage('Push Docker Image') {

            steps {

                sh '''
                docker push ${ECR_REPO}:latest
                '''

            }

        }


           stage('Deploy to EKS') {

        steps {

            sh '''
            set -x

            aws eks update-kubeconfig \
            --region ${AWS_REGION} \
            --name zomato-kastro-eks-v1

            kubectl apply -f Kubernetes/

            kubectl rollout status deployment/zomato --timeout=5m

            kubectl get pods -o wide

            kubectl get svc zomato

            echo "EKS Deployment Completed Successfully"
            '''

        }

    }

post {

    always {
        echo "Build result: ${currentBuild.result}"
    }

    success {
        echo "Pipeline Executed Successfully"
    }

    failure {
        echo "Pipeline Failed - Check previous stage logs"
    }

}

}
