FROM gcc:13

WORKDIR /app

# Create a non-root user
RUN useradd -m sandbox-user
USER sandbox-user

CMD ["bash", "-c", "g++ main.cpp -o main && ./main < input.txt"]

