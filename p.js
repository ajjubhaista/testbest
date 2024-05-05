
class List {
  constructor(data) {
    this.head = {
      value: data,
      next: null,
    };
    this.tail = this.head;
    this.size = 1;
  }
  appendNode(nodeData) {
    let newNode = {
      value: nodeData,
      next: null,
    };
    this.tail.next = newNode;
    this.tail = newNode;
    this.size += 1;
  }
  traversing() {
    let counter = 0;
    let currentNode = this.head;
    while (counter < this.size) {
      console.warn(currentNode);
      currentNode = currentNode.next;
      counter++;
    }
  }
  deleteNode(index) {
    let counter = 1;
    let lead = this.head;
    if (index === 1) {
      this.head = this.head.next;
    } else {
      while (counter < index - 1) {
        lead = lead.next;
        counter++;
      }
      let nextNode = lead.next.next;
      lead.next = nextNode;
      console.warn(lead);
    }
  }
  searchNode(data){
    let result = undefined;
    let lead= this.head;
    let loop=true;
    while(loop){
      lead=lead.next;
      // console.warn(lead)
      loop = !!lead;
      if(loop && lead.value === data){
        loop=false;
        result=lead;
      }
    }
    console.warn(result)
  }

}

let list = new List(200);
list.appendNode(300);
list.appendNode(400);
list.appendNode(500);
list.appendNode(600);
list.appendNode(700);
list.traversing();
// list.deleteNode(1);
// list.searchNode(900)

