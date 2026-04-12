const instances = [];

class Cleave {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    instances.push(this);
  }
}

module.exports = Cleave;
module.exports.default = Cleave;
module.exports.__cleaveInstances = instances;
