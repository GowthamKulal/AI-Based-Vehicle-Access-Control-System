export function connectToALPR(onData: (logEntry: any) => void): WebSocket {
  let retryCount = 0;
  const maxRetries = 5;
  let intentionalClose = false; // Track intentional closure in closure scope
  let socket: WebSocket;

  function connect(): WebSocket {
    try {
      socket = new WebSocket("ws://localhost:8000/ws/plates");

      socket.onopen = () => {
        console.log("WebSocket connection established");
        retryCount = 0;
      };

      socket.onmessage = (event) => {
        try {
          console.log("Received message:", event.data);
          const data = JSON.parse(event.data);

          if (data.timestamp) {
            const date = new Date(data.timestamp);
            data.formattedTime = date.toLocaleTimeString();
          }

          onData(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        console.error("WebSocket error details:", {
          readyState: socket.readyState,
          url: socket.url,
        });
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: code=${event.code}, reason=${event.reason}`);
        
        if (intentionalClose) {
          console.log("WebSocket closed intentionally, no retry needed");
          return;
        }

        if (event.code !== 1000 && retryCount < maxRetries) {
          retryCount++;
          console.log(`Attempting reconnect ${retryCount} of ${maxRetries}...`);
          setTimeout(() => {
            socket = connect();
          }, 2000 * retryCount);
        } else if (retryCount >= maxRetries) {
          console.error("Max retries reached. Could not reconnect.");
        }
      };

      // Return a wrapper object with the socket and a method to set intentional closure
      return Object.assign(socket, {
        setIntentionalClose: () => {
          intentionalClose = true;
          console.log("Marked WebSocket closure as intentional");
        },
      });
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      throw error;
    }
  }

  return connect();
}

export async function fetchFromALPR(
  endpoint: string,
  method: string = "GET",
  body?: any
) {
  try {
    const options: RequestInit = {
      method,
      headers:
        body instanceof FormData ? {} : { "Content-Type": "application/json" },
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`http://localhost:8000${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}
