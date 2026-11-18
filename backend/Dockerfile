# ==============================================================================
# Dockerfile Multi-Stage para U-Market Backend (Spring Boot + Java 21)
# Optimizado para Render (512 MB RAM en plan gratuito)
# ==============================================================================

# Etapa 1: Compilación con Maven y JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Etapa 2: Imagen ligera de ejecución (solo JRE 21)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xms128m", "-Xmx384m", "-jar", "app.jar"]
