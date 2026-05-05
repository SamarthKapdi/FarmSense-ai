FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="FarmSense AI Team"
LABEL description="FarmSense AI - Crop Disease Detection Platform"

WORKDIR /app

COPY target/farmsense-ai-2.0.0.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
