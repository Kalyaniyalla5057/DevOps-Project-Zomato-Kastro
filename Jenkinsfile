pipeline {

    agent any

    tools {
        jdk 'java21'
        nodejs 'node20'
    }

    environment {
    AWS_REGION = "ap-south-1"
    IMAGE_NAME = "zomato-kastro"
    ECR_REPO = "267673636065.dkr.ecr.ap-south-1.amazonaws.com/zomato-kastro"
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
                url: 'https://github.com/Kalyaniyalla5057/DevOps-Project-Zomato-Kastro.git',
                credentialsId: 'github-creds'
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
                sh '''
                npm install
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {

                withSonarQubeEnv('sonarqube') {

                    sh """
                    ${SCANNER_HOME}/bin/sonar-scanner \
                    -Dsonar.projectKey=zomato-kastro \
                    -Dsonar.projectName=zomato-kastro \
                    -Dsonar.sources=src
                    """

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
        dependencyCheck(
            additionalArguments: '--scan ./',
            odcInstallation: 'dependency-check'
        )
    }
}

stage('Publish OWASP Report') {
    steps {
        dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
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

                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                credentialsId: 'aws-creds']]) {

                    sh '''

                    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

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

                kubectl apply -f Kubernetes/

                kubectl rollout status deployment/zomato

                '''

            }

        }

    }

    post {

        success {

            echo 'Pipeline Executed Successfully'

        }

        failure {

            echo 'Pipeline Failed'

        }

    }

}
