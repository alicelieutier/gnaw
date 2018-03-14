class Message {
  constructor(body, destination, recordId) {
    this.body = body;
    this.destination = destination;
    this.recordId = recordId;
  }

  getBody() {
    return this.body;
  }

  getDestination() {
    return this.destination;
  }

  getRecordId() {
    return this.recordId;
  }
}

export default Message;
