# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM maven:3.9.7-eclipse-temurin-21 AS builder

WORKDIR /app
COPY pom.xml .
# Download dependencies in a cacheable layer
RUN mvn dependency:go-offline -U -q

COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/target/notewise-backend-1.0.0.jar app.jar

EXPOSE 4000

ENTRYPOINT ["java", "-jar", "app.jar"]
