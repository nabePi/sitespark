# Kubernetes Deployment Manifests: Tapsite.ai
## Production-Ready K8s Configuration

**Versi:** 1.0  
**Platform:** AWS EKS / GCP GKE / Azure AKS  
**Tools:** kubectl, helm, terraform  

---

## 1. NAMESPACE CONFIGURATION

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tapsite-production
  labels:
    name: tapsite-production
    environment: production
    app.kubernetes.io/name: tapsite
    app.kubernetes.io/part-of: tapsite-platform
```

---

## 2. CONFIGMAPS

### 2.1 Application Config
```yaml
# configmap/app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tapsite-app-config
  namespace: tapsite-production
data:
  NODE_ENV: "production"
  PORT: "3000"
  
  # Database
  DB_HOST: "tapsite-db.cluster-xxx.us-east-1.rds.amazonaws.com"
  DB_PORT: "5432"
  DB_NAME: "tapsite_production"
  DB_SSL: "true"
  DB_POOL_SIZE: "20"
  
  # Redis
  REDIS_HOST: "tapsite-redis.xxx.cache.amazonaws.com"
  REDIS_PORT: "6379"
  REDIS_DB: "0"
  
  # AI Models
  OPENAI_MODEL: "gpt-4-turbo-preview"
  CLAUDE_MODEL: "claude-3-5-sonnet-20241022"
  GEMINI_MODEL: "gemini-1.5-pro"
  
  # Rate Limiting
  RATE_LIMIT_WINDOW_MS: "60000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  
  # Features
  ENABLE_AI_GENERATION: "true"
  ENABLE_IMAGE_GENERATION: "true"
  ENABLE_ANALYTICS: "true"
  
  # URLs
  API_BASE_URL: "https://api.tapsite.ai"
  FRONTEND_URL: "https://tapsite.ai"
  CDN_BASE_URL: "https://cdn.tapsite.ai"
  
  # Token Economy
  SIGNUP_TOKEN_BONUS: "50000"
  DAILY_LOGIN_BONUS: "1000"
  REFERRAL_BONUS: "10000"
  WEBSITE_GENERATION_COST: "10000"
  IMAGE_GENERATION_COST: "2000"
---
```

### 2.2 Nginx Config
```yaml
# configmap/nginx-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: tapsite-production
data:
  nginx.conf: |
    user nginx;
    worker_processes auto;
    error_log /var/log/nginx/error.log warn;
    pid /var/run/nginx.pid;

    events {
        worker_connections 4096;
        use epoll;
        multi_accept on;
    }

    http {
        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        # Logging
        log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for" '
                        'rt=$request_time uct="$upstream_connect_time" '
                        'uht="$upstream_header_time" urt="$upstream_response_time"';

        access_log /var/log/nginx/access.log main;

        # Performance
        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;
        client_max_body_size 50M;

        # Compression
        gzip on;
        gzip_vary on;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types text/plain text/css text/xml application/json 
                   application/javascript application/rss+xml 
                   application/atom+xml image/svg+xml;

        # Rate limiting zones
        limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
        limit_req_zone $binary_remote_addr zone=ai:10m rate=20r/m;

        upstream api {
            server tapsite-api:3000;
            keepalive 32;
        }

        upstream ai-engine {
            server tapsite-ai-engine:3000;
            keepalive 32;
        }

        server {
            listen 80;
            server_name _;
            root /usr/share/nginx/html;
            index index.html;

            # Health check
            location /health {
                access_log off;
                return 200 "healthy\n";
                add_header Content-Type text/plain;
            }

            # API routes
            location /api/ {
                limit_req zone=api burst=20 nodelay;
                
                proxy_pass http://api;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
                proxy_read_timeout 300s;
                proxy_connect_timeout 75s;
            }

            # AI Engine routes
            location /api/ai/ {
                limit_req zone=ai burst=5 nodelay;
                
                proxy_pass http://ai-engine;
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_read_timeout 600s;  # Longer timeout for AI
            }

            # WebSocket support
            location /ws/ {
                proxy_pass http://api;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_read_timeout 86400s;
                proxy_send_timeout 86400s;
            }

            # Static files
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                try_files $uri $uri/ =404;
            }

            # SPA fallback
            location / {
                try_files $uri $uri/ /index.html;
            }
        }
    }
```

---

## 3. SECRETS

### 3.1 Application Secrets
```yaml
# secrets/app-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: tapsite-app-secrets
  namespace: tapsite-production
type: Opaque
stringData:
  # Database
  DB_PASSWORD: "your-secure-db-password"
  DATABASE_URL: "postgresql://user:pass@host:5432/tapsite_production"
  
  # Redis
  REDIS_PASSWORD: "your-redis-password"
  REDIS_URL: "redis://:pass@host:6379/0"
  
  # JWT
  JWT_SECRET: "your-256-bit-jwt-secret-key"
  JWT_REFRESH_SECRET: "your-refresh-secret"
  
  # AI APIs
  OPENAI_API_KEY: "sk-xxx"
  ANTHROPIC_API_KEY: "sk-ant-xxx"
  GOOGLE_AI_API_KEY: "xxx"
  MOONSHOT_API_KEY: "xxx"
  
  # Image Generation
  STABILITY_API_KEY: "sk-xxx"
  DALLE_API_KEY: "sk-xxx"
  
  # Cloudflare
  CLOUDFLARE_API_TOKEN: "xxx"
  CLOUDFLARE_ZONE_ID: "xxx"
  CLOUDFLARE_R2_ACCESS_KEY: "xxx"
  CLOUDFLARE_R2_SECRET_KEY: "xxx"
  
  # Payment
  MIDTRANS_SERVER_KEY: "xxx"
  MIDTRANS_CLIENT_KEY: "xxx"
  XENDIT_SECRET_KEY: "xxx"
  
  # Email
  SMTP_HOST: "smtp.sendgrid.net"
  SMTP_USER: "apikey"
  SMTP_PASS: "SG.xxx"
  
  # Webhook secrets
  WEBHOOK_SECRET: "whsec_xxx"
```

---

## 4. DATABASE (PostgreSQL)

### 4.1 PostgreSQL StatefulSet
```yaml
# database/postgresql-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: tapsite-postgresql
  namespace: tapsite-production
  labels:
    app: postgresql
    component: database
spec:
  serviceName: postgresql
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
        component: database
    spec:
      containers:
      - name: postgresql
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: tapsite_production
        - name: POSTGRES_USER
          value: tapsite
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: tapsite-app-secrets
              key: DB_PASSWORD
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - tapsite
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - tapsite
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3  # AWS EBS
      resources:
        requests:
          storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgresql
  namespace: tapsite-production
  labels:
    app: postgresql
spec:
  selector:
    app: postgresql
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

---

## 5. REDIS

### 5.1 Redis Deployment
```yaml
# cache/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tapsite-redis
  namespace: tapsite-production
  labels:
    app: redis
    component: cache
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
        component: cache
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
          name: redis
        command:
        - redis-server
        - --requirepass
        - $(REDIS_PASSWORD)
        - --maxmemory
        - 2gb
        - --maxmemory-policy
        - allkeys-lru
        - --appendonly
        - "yes"
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: tapsite-app-secrets
              key: REDIS_PASSWORD
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "1Gi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - -a
            - $(REDIS_PASSWORD)
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: tapsite-production
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: tapsite-production
  labels:
    app: redis
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

---

## 6. API SERVICE

### 6.1 API Deployment
```yaml
# services/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tapsite-api
  namespace: tapsite-production
  labels:
    app: api
    version: v2.3.1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
        version: v2.3.1
    spec:
      containers:
      - name: api
        image: tapsite/api:v2.3.1
        ports:
        - containerPort: 3000
          name: http
        envFrom:
        - configMapRef:
            name: tapsite-app-config
        env:
        - name: SERVICE_NAME
          value: "api"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: tapsite-api
  namespace: tapsite-production
  labels:
    app: api
spec:
  selector:
    app: api
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

---

## 7. AI ENGINE SERVICE

### 7.1 AI Engine Deployment
```yaml
# services/ai-engine-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tapsite-ai-engine
  namespace: tapsite-production
  labels:
    app: ai-engine
    version: v2.3.1
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: ai-engine
  template:
    metadata:
      labels:
        app: ai-engine
        version: v2.3.1
    spec:
      containers:
      - name: ai-engine
        image: tapsite/ai-engine:v2.3.1
        ports:
        - containerPort: 3000
          name: http
        envFrom:
        - configMapRef:
            name: tapsite-app-config
        env:
        - name: SERVICE_NAME
          value: "ai-engine"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: tapsite-app-secrets
              key: OPENAI_API_KEY
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: tapsite-app-secrets
              key: ANTHROPIC_API_KEY
        - name: GOOGLE_AI_API_KEY
          valueFrom:
            secretKeyRef:
              name: tapsite-app-secrets
              key: GOOGLE_AI_API_KEY
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: tapsite-ai-engine
  namespace: tapsite-production
  labels:
    app: ai-engine
spec:
  selector:
    app: ai-engine
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

---

## 8. HORIZONTAL POD AUTOSCALER

### 8.1 API HPA
```yaml
# autoscaling/api-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tapsite-api-hpa
  namespace: tapsite-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tapsite-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

### 8.2 AI Engine HPA
```yaml
# autoscaling/ai-engine-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tapsite-ai-engine-hpa
  namespace: tapsite-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tapsite-ai-engine
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Pods
    pods:
      metric:
        name: ai_requests_per_second
      target:
        type: AverageValue
        averageValue: "10"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 10
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
```

---

## 9. INGRESS

### 9.1 NGINX Ingress
```yaml
# ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tapsite-ingress
  namespace: tapsite-production
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://tapsite.ai, https://*.tapsite.ai"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
spec:
  tls:
  - hosts:
    - tapsite.ai
    - www.tapsite.ai
    - api.tapsite.ai
    secretName: tapsite-tls
  rules:
  - host: tapsite.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tapsite-frontend
            port:
              number: 80
  - host: www.tapsite.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tapsite-frontend
            port:
              number: 80
  - host: api.tapsite.ai
    http:
      paths:
      - path: /ai
        pathType: Prefix
        backend:
          service:
            name: tapsite-ai-engine
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tapsite-api
            port:
              number: 3000
```

---

## 10. CERTIFICATE MANAGER

```yaml
# certs/certificate.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: tapsite-tls
  namespace: tapsite-production
spec:
  secretName: tapsite-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - tapsite.ai
  - www.tapsite.ai
  - api.tapsite.ai
  - *.tapsite.ai
```

---

## 11. SERVICE MONITOR (Prometheus)

```yaml
# monitoring/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: tapsite-metrics
  namespace: tapsite-production
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: api
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
```

---

## 12. NETWORK POLICIES

```yaml
# network/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: tapsite-production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-ingress
  namespace: tapsite-production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-database-egress
  namespace: tapsite-production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

---

## 13. BACKUP CRONJOB

```yaml
# backup/postgres-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: tapsite-production
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump \
                -h postgresql \
                -U tapsite \
                -d tapsite_production \
                -F c \
                -f /backup/tapsite_$(date +%Y%m%d_%H%M%S).dump
              
              # Upload to S3
              aws s3 cp /backup/ s3://tapsite-backups/postgres/ \
                --recursive --storage-class STANDARD_IA
              
              # Cleanup old backups (keep 30 days)
              find /backup -name "*.dump" -mtime +7 -delete
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: tapsite-app-secrets
                  key: DB_PASSWORD
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: tapsite-app-secrets
                  key: AWS_ACCESS_KEY_ID
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: tapsite-app-secrets
                  key: AWS_SECRET_ACCESS_KEY
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          volumes:
          - name: backup-volume
            emptyDir: {}
          restartPolicy: OnFailure
```

---

## 14. DEPLOYMENT COMMANDS

```bash
# Apply all configurations
kubectl apply -f namespace.yaml
kubectl apply -f configmap/
kubectl apply -f secrets/
kubectl apply -f database/
kubectl apply -f cache/
kubectl apply -f services/
kubectl apply -f autoscaling/
kubectl apply -f ingress/
kubectl apply -f monitoring/
kubectl apply -f network/
kubectl apply -f backup/

# Verify deployments
kubectl get pods -n tapsite-production
kubectl get svc -n tapsite-production
kubectl get hpa -n tapsite-production
kubectl get ingress -n tapsite-production

# Check logs
kubectl logs -f deployment/tapsite-api -n tapsite-production
kubectl logs -f deployment/tapsite-ai-engine -n tapsite-production

# Scale manually (if needed)
kubectl scale deployment tapsite-api --replicas=10 -n tapsite-production

# Rollout restart
kubectl rollout restart deployment/tapsite-api -n tapsite-production

# Check rollout status
kubectl rollout status deployment/tapsite-api -n tapsite-production
```

---

## 15. RESOURCE REQUIREMENTS SUMMARY

| Component | Replicas | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|----------|-------------|----------------|-----------|--------------|
| API | 3-20 | 250m | 512Mi | 1000m | 1Gi |
| AI Engine | 5-50 | 500m | 1Gi | 2000m | 4Gi |
| PostgreSQL | 1 | 1000m | 2Gi | 2000m | 4Gi |
| Redis | 1 | 250m | 1Gi | 500m | 2Gi |
| Nginx | 2 | 100m | 128Mi | 250m | 256Mi |

**Total Minimum Resources:**
- CPU: ~6 cores
- Memory: ~12 GB

---

*Manifests ini dirancang untuk production use dengan high availability, auto-scaling, dan security best practices.*
