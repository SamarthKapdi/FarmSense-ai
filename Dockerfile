# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
# Download dependencies
RUN ./mvnw dependency:go-offline -B
COPY src ./src
# Package the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/farmsense-0.0.1-SNAPSHOT.jar app.jar
# Expose the dynamic port Render will provide
EXPOSE 8080
# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
