# Stage 1: Build using Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies first to maximize Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Rename the generated JAR to a fixed name for the next stage
RUN cp target/*.jar target/app.jar

# Stage 2: Minimal Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/app.jar app.jar

# Expose the port (Render assigns dynamically, but 8080 is the default container port)
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
