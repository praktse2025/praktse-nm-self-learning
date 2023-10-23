@Library('web-service-helper-lib') _

pipeline {
    agent { label 'docker' }

    environment {
        TARGET_PREFIX = 'e-learning-by-sse/nm-self-learning'
        API_VERSION = packageJson.getVersion() // package.json must be in root level in order for this to work
        NX_BASE='master'
        NX_HEAD='HEAD'
    }

    options {
        ansiColor('xterm')
    }

    stages { 
        stage("NodeJS Build") {
            agent {
                docker {
                    image 'node:18-bullseye'
                    reuseNode true
                    args '--tmpfs /.cache -v $HOME/.npm:/.npm'
                }
            }
            steps {
                sh 'git fetch origin master:master'
                sh 'npm ci --force'
                sh 'cp -f .env.example .env'
                script {
                    if (buildingTag()) { 
                        sh 'npm run build'
                    } else {
                        sh 'npm run build:affected'
                    }
                }
            }
        }
        stage('Tests') {
            environment {
                POSTGRES_DB = 'SelfLearningDb'
                POSTGRES_USER = 'username'
                POSTGRES_PASSWORD = 'password'
                DATABASE_URL = "postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@db:5432/${env.POSTGRES_DB}"
            }
            steps {
                script {
                    withPostgres([ dbUser: env.POSTGRES_USER,  dbPassword: env.POSTGRES_PASSWORD,  dbName: env.POSTGRES_DB ]).insideSidecar('node:18-bullseye', '--tmpfs /.cache -v $HOME/.npm:/.npm') {
                        if (buildingTag()) { 
                            sh 'npm run test'
                        } else {
                            sh 'npm run prisma db push'
                            sh 'npm run test:affected'
                        }
                    }
                }
            }
        }
        stage('Publish Tagged Release') {
            when {
                buildingTag()
            }
            steps {
                ssedocker {
                    create {
                        target "${env.TARGET_PREFIX}:latest"
                    }
                    publish {
                        tag "${env.API_VERSION}"
                    }
                }
            }
        }
        stage('Publish and Deploy Unstable') {
            when {
                branch 'master'
            }
            steps {
                ssedocker {
                    create { target "${env.TARGET_PREFIX}:unstable" }
                    publish {}
                }
            }
            post {
                success {
                    staging02ssh "bash /opt/update-compose-project.sh selflearn-staging"
                }
            }
        }
        stage('Docker Publish PB') {
            environment {
                VERSION = "${env.API_VERSION}.${env.BRANCH_NAME.split('_')[-1]}"
            }
            when {
                expression { env.BRANCH_NAME.startsWith("pb_") }
            }
            steps {
                ssedocker {
                    create { target "${env.TARGET_PREFIX}:${env.VERSION}" }
                    publish {}
                }
            }
            post {
                success {
                    staging02ssh "python3 /opt/selflearn-branches/demo-manager.py new-container:${env.VERSION}:${env.BRANCH_NAME} generate-html"
                }
            }
        }
    }
}
