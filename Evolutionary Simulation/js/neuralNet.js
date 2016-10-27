/* neuralNet.js
 ***************************************************
 *
 * This script provides functionality for creating, manipulating, and drawing artificial neural networks.
 *
 ***************************************************/

var neuralNet = {

	// A single neuron, which accepts weighted inputs, and outputs a corresponding value
	Neuron: class {

		constructor(numInputs, bias) {
			// The number of inputs into the neuron
			this.numInputs = numInputs;

			// The weights for each input
			this.weights = [];

			// The bias value
			this.bias = bias;

			// The last value that was outputted from this neuron
			this.lastOutput;

			// Randomise the initial weights
			for(var i = 0; i < this.numInputs + 1; i++) {
				this.weights.push(Math.random() * 2 - 1);
			}
		}

	},

	// A collection of neurons that accepts input from the previous layer, and outputs it to the next
	NeuronLayer: function(numNeurons, numInputsPerNeuron, bias) {
		// The number of neurons in the layer
		this.numNeurons = numNeurons;

		// The neurons
		this.neurons = [];

		for(var i = 0; i < this.numNeurons; i++) {
			this.neurons.push(new neuralNet.Neuron(numInputsPerNeuron, bias));
		}
	},

	// A neural netork, composed of neuron layers, which are composed of neurons, which are connected to each other
	// such that inputs passed into the network will protogate through all neurons, finally producing an overall output
	NeuralNet: class {

		constructor(numInputs, numOutputs, numHiddenLayers, neuronsPerHiddenLayer, bias, activationFunction) {
			this.numInputs = numInputs;

			this.numOutputs = numOutputs;

			// Hidden layers are layers that aren't directly connected to inputs or outputs of the network
			this.numHiddenLayers = numHiddenLayers;
			this.neuronsPerHiddenLayer = neuronsPerHiddenLayer;

			this.neuronLayers = [];

			this.lastInputs = [];

			// The function that will be used to calculate the output of each neuron (or peceptron) from its summed and
			// weighted inputs
			this.activation = activationFunction;

			//for each hidden layer
			for(var i = 0; i < numHiddenLayers; i++) {
				//pass in the correct numbr of inputs into the layer
				if(i === 0)
					this.neuronLayers.push(new neuralNet.NeuronLayer(this.neuronsPerHiddenLayer[0], this.numInputs, bias));
				else
					this.neuronLayers.push(new neuralNet.NeuronLayer(this.neuronsPerHiddenLayer[i], this.neuronsPerHiddenLayer[i - 1], bias));
			}

			//create the output layer
			this.neuronLayers.push(new neuralNet.NeuronLayer(this.numOutputs, this.neuronsPerHiddenLayer[numHiddenLayers - 1], bias));
		}

		// Returns all weights in the neural network in a flat array
		getWeights() {
			//stores the weights
			var weights = [];

			//for each layer
			for(var i = 0; i < this.neuronLayers.length; i++) {
				//for each neuron
				for(var j = 0; j < this.neuronLayers[i].numNeurons; j++) {
					//for each weight
					for(var k = 0; k < this.neuronLayers[i].neurons[j].numInputs + 1; k++) {
						//add the weight to weights
						weights.push(this.neuronLayers[i].neurons[j].weights[k]);
					}
				}
			}

			//return the weights
			return weights;
		}

		// Returns the number of weights in the network
		getNumberOfWeights() {
			//stores the number of weights
			var numWeights = 0;

			//for each layer
			for(var i = 0; i < this.neuronLayers.length; i++) {
				//for each neuron
				for(var j = 0; j < this.neuronLayers[i].numNeurons; j++) {
					//add the number of weights in that neuron
					numWeights += this.neuronLayers[i].neurons[j].numInputs + 1;
				}
			}

			//return the total
			return numWeights;
		}

		// Replaces the current weights with the ones provided
		replaceWeights(weights) {
			//make sure that the inputted weights are of the correct length (otherwise errors could ensue)
			if(weights.length === this.getNumberOfWeights()) {
				//iterator
				var currentWeight = 0;

				//for each layer
				for(var i = 0; i < this.neuronLayers.length; i++) {
					//for each neuron
					for(var j = 0; j < this.neuronLayers[i].numNeurons; j++) {
						//for each weight
						for(var k = 0; k < this.neuronLayers[i].neurons[j].numInputs + 1; k++) {
							//replace each weight with the corresponding inputted weight
							this.neuronLayers[i].neurons[j].weights[k] = weights[currentWeight];
							currentWeight++;
						}
					}
				}
			}
		}

		// Calculates the output of the network from a set of inputs
		update(inputs) {
			//make sure that the inputted inputs are of the correct length (otherwise errors could ensue)
			if(inputs.length != this.numInputs)
				return [];
			
			//stores the outputs for each layer and the final
			var outputs = [];

			//sets the previous weights to the current weights (slice allows copying of array contents)
			this.lastInputs = inputs.slice();

			//for each layer
			for(var i = 0; i < this.numHiddenLayers + 1; i++) {
				//if the first layer
				if(i > 0) {
					//set the inputs for the layer to the inputs into the network
					inputs = []
					inputs.length = 0;
					inputs = outputs.slice();
				}
				outputs.length = 0;

				//for each neuron
				for(var j = 0; j < this.neuronLayers[i].numNeurons; j++) {
					//add the weighted bias to the input
					var netInput = this.neuronLayers[i].neurons[j].bias * this.neuronLayers[i].neurons[j].weights[this.neuronLayers[i].neurons[j].weights.length - 1];
					var currentWeight = 0;
					
					//for each weight
					for(var k = 0; k < this.neuronLayers[i].neurons[j].numInputs; k++) {
						//add each weighted input to the total input
						netInput += this.neuronLayers[i].neurons[j].weights[k] * inputs[currentWeight];
						currentWeight++;
					}
					//pass the net input through the activation function to obtain an output
					var act = this.activation(netInput, 1);

					//add the output to the layers outputs
					outputs[outputs.length] = act;

					this.neuronLayers[i].neurons[j].lastOutput = act;
				}
			}

			//return the outputs of the network
			return outputs;
		}

	},

	// Container for all neuron activation functions
	activationFunctions: {
		// Returns 1 if the input is greater than 0, 0 otherwise
		threshold: function(input) {
			if(input > 0)
				return 1;
			else
				return 0;
		},

		// Returns the sigmoid of the input
		sigmoid: function(input, p) {
			return 1 / (1 + Math.exp((0 - input), p));
		}
	},

	// Default settings for the drawing of networks
	drawSettings: {
		//dimensions of the canvas
		canvasWidth: 680,
		canvasHeight: 360,

		//colours for network elements
		inputNodeColour: "#00FF00",
		hiddenNodeColour: "#606060",
		outputNodeColour: "#FF0000",
		connectionColour: "#000000",
		negativeConnectionColour: "#FF0000",
		weightTextColour: "#0000FF",
		backgroundColour: "#FFFFFF",
		lastTextColour: "#0000FF",

		//size of each network node
		nodeSize: 30,

		//default width of each connection before being multiplied by its weight
		connectionWidth: 8,

		nodeOutlineColour: "#000000",
		nodeOutlineWidth: 8,

		//size of weight text
		textSize: "15",

		//spacing parameters
		leftMargin: 50,
		topMargin: 50,
		spacing: 80,
		horzSpacingMod: 2,

		//what to draw
		drawNodes: true,
		drawConnections: true,
		drawWeights: true,
		drawLastOutput: true
	}

};