/* Script.js
 ***************************************************
 *
 * This script is responsible for simulating and drawing the world, as well as managing the HTML interface and
 * its events.
 *
 ***************************************************/

/* GLOBALS
 ***************************************************/

// The canvas on which the world is drawn
var simCanvas;

// The canvas on which the population progress graph is drawn
var graphCanvas;

// The canvas on which the selected agent network is drawn
var netCanvas;

// The list of  currently alive agents
var population = [];

// The list of currently existing corpses (created when agents die)
var corpses = [];

// The species object from geneticAlg.js that corresponds to the current population
var species;

// The list of food blobs
var foodBlobs = [];

// The current position of the cursor relative to the canvas element's top left corner
var mousePos = {x: 0, y: 0};

// A list of keys that are currently pressed
var pressedKeys = [];

// The position of the mouse last position update
var lastMousePos = mousePos;

// The current update frame in the current generation
var currentFrame = 0;

// The current simulation time in the current generation. Measured in abstract units that are independent of frame-rate
// and time
var currentTime = 0;

// The current generation number
var generation = 0;

// The total fitness last generation
var lastTotal = 0;

// The average fitness last generation
var lastAverage = 0;

// The best fitness last generation
var lastBest = 0;

// The best fitness of all generations
var bestEver = 0;

// The avergae fitness for each generation that has passed
var averageHistory = [];

// The best fitness for each generation that has passed
var bestHistory = [];

// The total food that has been eaten by agents this generation
var totalFoodEaten = 0;

// The currently selected agent
var selectedAgent;

// Whether the user is currently dragging the canvas
var draggingSimCanvas = false;

// The frame delay timer is stored in a global variable so it can be accessed and cleared from anywhere
var timer;

// Whether the simulation is currently paused
var paused = false;


var newGenerationTimer = 0;

// Initial function that runs on startup
function init() {
	setupUI();
	reset();
	runGeneration();
}

// Resets all relevant variables to restart the simulation
function reset() {
	// Stop the current frame timer
	clearTimeout(timer);

	// Reset variables
	population = [];
	species = new geneticAlg.Species(
		settings.species.populationSize,
		settings.species.mutationRate,
		settings.species.mutationMin,
		settings.species.mutationMax,
		settings.species.crossoverRate,
		new neuralNet.NeuralNet(
			settings.network.numInputs,
			settings.network.numOutputs,
			settings.network.numHiddenLayers,
			settings.network.neuronsPerHiddenLayer,
			settings.network.bias,
			settings.network.activationFunction).getNumberOfWeights(),
		settings.species.bitMin,
		settings.species.bitMax,
		settings.species.numElite
	);
	foodBlobs = [];
	currentFrame = 0;
	currentTime = 0;
	generation = 0;
	lastTotal = 0;
	lastAverage = 0;
	lastBest = 0;
	bestEver = 0;
	averageHistory = [];
	bestHistory = [];
	totalFoodEaten = 0;
	selectedAgent = undefined;
	paused = false;
}

// Setup each canvas
function setupUI() {
	// Get the target width and height of the canvas
	var width = window.innerWidth - $("#inspector").outerWidth();
	var height = window.innerHeight - $("#titleBar").outerHeight() - $("#infoBar").outerHeight();

	// Create the simulation canvas object from the DOM element
	var simCanvasObj = document.getElementById("simCanvas");
	simCanvas = new Canvas(simCanvasObj, width, height, 2);

	// Move and zoom inside the canvas so that the world fits within the canvas object
    if(simCanvas.width > simCanvas.height) {
        simCanvas.zoom = simCanvas.height / settings.simulation.worldHeight;
    } else {
        simCanvas.zoom = simCanvas.width / settings.simulation.worldWidth;
    }

	// Create the graph canvas object from the DOM element
	var graphCanvasObj = document.getElementById("graphCanvas");
	graphCanvas = new Canvas(graphCanvasObj, settings.drawGraph.canvasWidth, settings.drawGraph.canvasHeight, 2,
        settings.drawGraph.backgroundColour);

	// Create the simulation canvas object from the DOM element
	var netCanvasObj = document.getElementById("networkCanvas");
	netCanvas = new Canvas(netCanvasObj, settings.drawNetwork.canvasWidth, settings.drawNetwork.canvasHeight, 2,
		settings.drawNetwork.backgroundColour);

	$("#timeScale").prop("min", settings.simulation.minSpeedModifier * 100);
	$("#timeScale").prop("max", settings.simulation.maxSpeedModifier * 100);
}

// Complete a full generation including evolution, simulation and fitness evaluation
function runGeneration(reset = true) {
	if(reset) {
		lastTotal = 0;
		totalFoodEaten = 0;

		// Evolve the genomes
		if(generation != 0) {
			species.advanceGeneration();
		}

		// Reset population and create new agents from corresponding genomes
		population.length = 0;
		for(var i = 0; i < settings.species.populationSize; i++) {
			var network = new neuralNet.NeuralNet(settings.network.numInputs, settings.network.numOutputs, settings.network.numHiddenLayers, settings.network.neuronsPerHiddenLayer, settings.network.bias, settings.network.activationFunction);
			network.replaceWeights(species.population[i].chromo);
			var isElite = species.population[i].elite;
			var agent = new Agent(getRandomWorldX(), getRandomWorldY(), Math.random() * 2 * Math.PI, settings.simulation.agentStartingFullness, settings.simulation.agentHungerRate, network, isElite);
			population.push(agent);
		}
		corpses.length = 0;

		// Show the new generation text
		newGenerationTimer = settings.drawWorld.newSimulationTextTimer;

		// Run the simulation for a certain amount of simulation time
		currentFrame = 0;
		currentTime = 0;
	}

	runFrame(settings.simulation.generationLength);
}

function assignFitnesses(finishedCallback) {{
	// Assign fitnesses to each genome
	for(var i = 0; i < population.length; i++) {
		var fitness = population[i].foodCollected + 0.1;

		population[i].network.fitness = fitness;
		species.population[i].fitness = fitness;
		lastTotal += fitness;
	}

	lastAverage = lastTotal / settings.species.populationSize;
	averageHistory.push(lastAverage);

	lastBest = species.getBest().obj.fitness;
	if(lastBest > bestEver)
		bestEver = lastBest;
	bestHistory.push(lastBest);

	// Run another generation if appropriate
	generation++;
	if(generation < settings.simulation.numGenerations) {
		runGeneration();
	}
}}

function runFrame(timeUnits) {
	if(!paused) {
		update(currentFrame);

		if(currentTime >= timeUnits) {
			if(shouldAdvanceGeneration()) {
				clearTimeout(timer);
				assignFitnesses();
				return;
			} else {
				currentTime = 0;
				currentFrame = 0;
			}
		}

		currentFrame++;
		currentTime += settings.simulation.simSpeedModifier;
	}

	if(settings.drawWorld.draw && currentFrame % settings.drawWorld.updatesPerDraw === 0)
		draw();

	if(settings.drawGraph.draw)
		drawGraph();

	if(currentFrame % settings.drawWorld.updatesPerStatDraw === 0)
		drawStats();

	if(settings.drawWorld.draw) {
		timer = setTimeout(function() {
			runFrame(timeUnits);
		}, settings.simulation.frameDelayDrawing);
	} else {
		timer = setTimeout(function() {
			runFrame(timeUnits);
		}, settings.simulation.frameDelay);
	}
}

function update(currentFrame) {
	if(foodBlobs.length < settings.simulation.maxFood) {
		spawnFood(settings.simulation.maxFood - foodBlobs.length);
	}

	for(var i = 0; i < population.length; i++) {
		population[i].update(currentFrame);
	}

	for(var i = 0; i < corpses.length; i++) {
		corpses[i].update(currentFrame);
	}
}

// Draw
function draw() {
	if(draggingSimCanvas) {
		simCanvas.scrollX += (mousePos.x - lastMousePos.x) / simCanvas.zoom;
		simCanvas.scrollY += (mousePos.y - lastMousePos.y) / simCanvas.zoom;
	}

	if(keyPressed(37)) {
		simCanvas.scrollX += settings.drawWorld.keyScrollSpeed / simCanvas.zoom;
	}
	if(keyPressed(38)) {
		simCanvas.scrollY += settings.drawWorld.keyScrollSpeed / simCanvas.zoom;
	}
	if(keyPressed(39)) {
		simCanvas.scrollX -= settings.drawWorld.keyScrollSpeed / simCanvas.zoom;
	}
	if(keyPressed(40)) {
		simCanvas.scrollY -= settings.drawWorld.keyScrollSpeed / simCanvas.zoom;
	}

	simCanvas.clear();
	simCanvas.fillStyle = settings.drawWorld.worldColour;
	simCanvas.fillRect(0, 0, settings.simulation.worldWidth, settings.simulation.worldHeight);

	// Draw trails
	for(var i = 0; i < population.length; i++) {
		population[i].drawTrail(simCanvas);
	}

	// Draw food blobs
	for(var i = 0; i < foodBlobs.length; i++) {
		foodBlobs[i].draw(simCanvas);
	}

	// Draw agents
	for(var i = 0; i < population.length; i++) {
		population[i].draw(simCanvas);
		if(population[i] == selectedAgent) {
			drawSelection(simCanvas, selectedAgent.x, selectedAgent.y, settings.simulation.agentSize * 1.4);
		}
	}

	// Draw corpses
	for(var i = 0; i < corpses.length; i++) {
		corpses[i].draw(simCanvas);
	}

    if(newGenerationTimer > 0) {
        newGenerationTimer -= 2;
        simCanvas.fillStyle = "#FFFFFF";
        simCanvas.fontSize = 200;
        simCanvas.globalAlpha = newGenerationTimer / settings.drawWorld.newSimulationTextTimer;
        simCanvas.drawInCanvasSpace(function() {
            simCanvas.fillText("Generation " + generation, simCanvas.width / 2 - 50, simCanvas.height / 2);
        });
        simCanvas.globalAlpha = 1;
    }

	lastMousePos = mousePos;
}

// Update the statistics shown throughout the interface
function drawStats() {
	if(selectedAgent && !selectedAgent.dead) {
		$("#agentFullness").html(Math.round(selectedAgent.fullness * 100) / 100);
		$("#agentFood").html(selectedAgent.foodCollected);

		if(settings.drawNetwork.redraw) {
			drawNetwork(netCanvas, selectedAgent.network);
		}
	} else {
        $("#agentFullness").html("-");
        $("#agentFood").html("-");
        netCanvas.clear();
    }

	$("#generation").html(Math.round(generation * 100) / 100);
	$("#updateFrame").html(Math.round(currentTime * 100) / 100 + "/" + settings.simulation.generationLength);

	$("#aliveAgents").html(population.length);
	$("#deadAgents").html(settings.species.populationSize - population.length);
	$("#totalFood").html(totalFoodEaten);
	$("#averageFood").html(Math.round((totalFoodEaten / population.length) * 100) / 100);
	var bestAgent = getBestAgent();
	if(bestAgent != undefined) {
		$("#bestFood").html(bestAgent.foodCollected);
	} else {
		$("#bestFood").html("0");
	}


	$("#lastAverage").html(Math.round(lastAverage * 100) / 100);
	$("#lastBest").html(Math.round(lastBest * 100) / 100);
}

// Draws the population progression graph
function drawGraph() {
	graphCanvas.fillStyle = settings.drawGraph.backgroundColour;
	graphCanvas.fillRect(0, 0, settings.drawGraph.canvasWidth, settings.drawGraph.canvasHeight);

	if(averageHistory.length > 1) {
		var horzScaleFactor = settings.drawGraph.autoScaleHorz ? settings.drawGraph.canvasWidth / averageHistory.length : settings.drawGraph.horzScaleFactor;
		var vertScaleFactor = settings.drawGraph.autoScaleVert ? settings.drawGraph.canvasHeight / (bestEver + 10) : settings.drawGraph.vertScaleFactor;

		// Draw the grid lines
		graphCanvas.strokeStyle = settings.drawGraph.markColour;
		for(var i = 0; i < Math.floor(settings.drawGraph.canvasHeight / settings.drawGraph.markSpacing); i++) {
			graphCanvas.beginPath();
			graphCanvas.moveTo(0, settings.drawGraph.canvasHeight - (i * settings.drawGraph.markSpacing * vertScaleFactor));
			graphCanvas.lineTo(settings.drawGraph.canvasWidth, settings.drawGraph.canvasHeight - (i * settings.drawGraph.markSpacing * vertScaleFactor));
			graphCanvas.stroke();
		}

		// Draw the average fitness per generation graph
		graphCanvas.strokeStyle = settings.drawGraph.averageColour;
		graphCanvas.beginPath();
		graphCanvas.moveTo(0, settings.drawGraph.canvasHeight - averageHistory[0]);
		for(var i = 0; i < averageHistory.length; i++) {
			graphCanvas.lineTo(i * horzScaleFactor, settings.drawGraph.canvasHeight - (averageHistory[i] * vertScaleFactor));
		}
		graphCanvas.stroke();

		// Draw the best fitness per generation graph
		graphCanvas.strokeStyle = settings.drawGraph.bestColour;
		graphCanvas.beginPath();
		graphCanvas.moveTo(0, settings.drawGraph.canvasHeight - bestHistory[0]);
		for(var i = 0; i < bestHistory.length; i++) {
			graphCanvas.lineTo(i * horzScaleFactor, settings.drawGraph.canvasHeight - (bestHistory[i] * vertScaleFactor));
		}
		graphCanvas.stroke();
	}
}

// Returns the coordinates of the closest food to the given coordinates
function closestFoodTo(x, y) {
	var closest;
	var closestDistance = 999999;

	for(var i = 0; i < foodBlobs.length; i++) {
		var distance = utils.distance(x, y, foodBlobs[i].x, foodBlobs[i].y);
		if(distance < closestDistance) {
			closest = foodBlobs[i];
			closestDistance = distance;
		}
	}

	if(closest == undefined) {
		return {x: x, y: y};
	} else {
		return {x: closest.x, y: closest.y};
	}
}

// Spawn a given number of food blobs at random locations
function spawnFood(num) {
	for(var i = 0; i < num; i++) {
		foodBlobs.push(
			new FoodBlob(getRandomWorldX(), getRandomWorldY())
		);
	}
}

// Draws a network onto a canvas
function drawNetwork(canvas, network) {
	var ds = neuralNet.drawSettings;

	canvas.clear();

	// Draw connections between nodes
	if(ds.drawConnections) {
		canvas.strokeStyle = ds.connectionColour;
		for(var i = 0; i < network.neuronLayers.length; i++) {
			for(var j = 0; j < network.neuronLayers[i].numNeurons; j++) {
				for(var k = 0; k < network.neuronLayers[i].neurons[j].numInputs; k++) {
					var width = ds.connectionWidth * network.neuronLayers[i].neurons[j].weights[k];
					if(width < 0) {
						canvas.lineWidth = Math.abs(width);
						canvas.strokeStyle = ds.negativeConnectionColour;
					} else {
						canvas.lineWidth = width;
						canvas.strokeStyle = ds.connectionColour;
					}

					canvas.beginPath();
					var pos1 = getPosOnCanvas(canvas, network, i + 1, j);
					canvas.moveTo(pos1.x, pos1.y);
					var pos2 = getPosOnCanvas(canvas, network, i, k);
					canvas.lineTo(pos2.x, pos2.y);
					canvas.stroke();

					if(ds.drawWeights) {
						var weight = Math.round(network.neuronLayers[i].neurons[j].weights[k] * 100) / 100;
						var pos = {x: ((pos1.x + pos2.x) / 2 + pos1.x) / 2, y: ((pos1.y + pos2.y) / 2 + pos1.y) / 2};

						canvas.fillStyle = ds.weightTextColour;
						canvas.fontSize = ds.textSize;
                        canvas.fontFamily = ds.textFont;
						canvas.fillText(weight, pos.x - 20, pos.y + 0.5 * parseInt(ds.textSize));
					}
				}
			}
		}
	}

	// Draw nodes
	if(ds.drawNodes) {
		canvas.strokeStyle = ds.nodeOutlineColour;
		canvas.lineWidth = ds.nodeOutlineWidth;

		// Draw the input neurons
		canvas.fillStyle = ds.inputNodeColour;
		for(var i = 0; i < network.numInputs; i++) {
			var pos = getPosOnCanvas(canvas, network, 0, i);
			canvas.beginPath();
			canvas.arc(pos.x, pos.y, ds.nodeSize, 0, 2 * Math.PI, false);
			canvas.fill();
			if(ds.nodeOutlineWidth > 0)
				canvas.stroke();
		}

		// Draw the hidden neurons
		canvas.fillStyle = ds.hiddenNodeColour;
		for(var i = 0; i < network.numHiddenLayers; i++) {
			for(var j = 0; j < network.neuronLayers[i].numNeurons; j++) {
				var pos = getPosOnCanvas(canvas, network, i + 1, j);
				canvas.beginPath();
				canvas.arc(pos.x, pos.y, ds.nodeSize, 0, 2 * Math.PI, false);
				canvas.fill();
				if(ds.nodeOutlineWidth > 0)
					canvas.stroke();
			}
		}

		// Draw the output neurons
		canvas.fillStyle = ds.outputNodeColour;
		for(var i = 0; i < network.numOutputs; i++) {
			var pos = getPosOnCanvas(canvas, network, network.numHiddenLayers + 1, i);
			canvas.beginPath();
			canvas.arc(pos.x, pos.y, ds.nodeSize, 0, 2 * Math.PI, false);
			canvas.fill();
			if(ds.nodeOutlineWidth > 0)
				canvas.stroke();
		}
	}

	// Draw the outputs on each neuron
	if(ds.drawLastOutput) {
		canvas.fillStyle = ds.lastTextColour;
		canvas.fontSize = ds.textSize;
        canvas.fontFamily = ds.textFont;

		for(var j = 0; j < network.numInputs; j++) {
			var pos = getPosOnCanvas(canvas, network, 0, j);
			canvas.fillText(Math.round(network.lastInputs[j] * 100) / 100, pos.x, pos.y);
		}
		if(ds.drawLastOutput) {
			for(var i = 0; i < network.neuronLayers.length; i++) {
				for(var j = 0; j < network.neuronLayers[i].numNeurons; j++) {
					var pos = getPosOnCanvas(canvas, network, i + 1, j);
					if(network.neuronLayers[i].neurons[j].lastOutput !== undefined) {
						canvas.fillText(Math.round(network.neuronLayers[i].neurons[j].lastOutput * 100) / 100, pos.x, pos.y);
					}
				}
			}
		}
	}

}

// Draw a selection circle at the given coordinates of the given radius
function drawSelection(canvas, x, y, radius) {
	canvas.strokeStyle = settings.drawWorld.selectionLineColour;
	canvas.lineWidth = settings.drawWorld.selectionLineWidth;
	canvas.beginPath();
	canvas.arc(x, y, radius, utils.degreesToRadians(100), utils.degreesToRadians(260));
	canvas.stroke();
	canvas.beginPath();
	canvas.arc(x, y, radius, utils.degreesToRadians(280), utils.degreesToRadians(80));
	canvas.stroke();
}

//returns the position on the canvas to draw a neuron of a index of a layer of a network
function getPosOnCanvas(canvas, network, layer, index) {
	var ds = neuralNet.drawSettings;

	var x = ds.leftMargin + layer *(ds.nodeSize + ds.spacing * ds.horzSpacingMod);
	var y = ds.topMargin + index * (ds.nodeSize + ds.spacing);

	return {x: x, y: y};
}

// Returns true if the given circles overlap, false otherwise
function circleCollision(x1, y1, r1, x2, y2, r2) {
	var distance = utils.distance(x1, y1, x2, y2);
	if(distance <= r1 + r2) {
		return true;
	}
	return false;
}

// Get a random y coorindate in world space
function getRandomWorldX() {
	return Math.random() * settings.simulation.worldWidth;
}

// Get a random x coordinate in world space
function getRandomWorldY() {
	return Math.random() * settings.simulation.worldHeight;
}

// Pause the simulation
function togglePause() {
	settings.drawWorld.draw = !settings.drawWorld.draw;
	if(settings.drawGraph.drawOnPause) {
		settings.drawGraph.draw = true;
	} else {
		settings.drawGraph.draw = !settings.drawGraph.draw;
	}
}

// Returns true if the given keycode is pressed, false otherwise
function keyPressed(keycode) {
	return pressedKeys.indexOf(keycode) != -1;
}

// Returns whether the simulation should advance to the next generation
function shouldAdvanceGeneration() {
	return $("#advanceCheck").prop("checked");
}

// Get the agent with the most food collected
function getBestAgent() {
	var bestFood = 0;
	var bestAgent;
	for(var i = 0; i < population.length; i++) {
		if(population[i].foodCollected > bestFood) {
			bestFood = population[i].foodCollected;
			bestAgent = population[i];
		}
	}
	return bestAgent;
}

// Select the given agent
function selectAgent(agent) {
	if(selectedAgent) {
		selectedAgent.selected = false;
	}
	selectedAgent = agent;
	agent.selected = true;

	neuralNet.drawSettings = settings.drawNetwork;
	drawNetwork(netCanvas, selectedAgent.network);
}

// Saves the current simulation data into json, which is output
function saveCurrentPopulation() {
    var agentsData = [];
    for(var i = 0; i < population.length; i++) {
        var agentData = {
            x: population[i].x,
            y: population[i].y,
            orientation: population[i].orientation,
            elite: population[i].elite,
            fullness: population[i].fullness,
            weights: population[i].network.getWeights()
        };
        agentsData.push(agentData);
    }

    var foodBlobsData = [];
    for(var i = 0; i < foodBlobs.length; i++) {
        var foodBlobData = {
            x: foodBlobs[i].x,
            y: foodBlobs[i].y
        };
        foodBlobsData.push(foodBlobData);
    }

    var corpsesData = [];
    for(var i = 0; i < corpses.length; i++) {
        var corpseData = {
            x: corpses[i].x,
            y: corpses[i].y,
            timer: corpses[i].timer
        };
        corpsesData.push(corpseData);
    }

    var saveData = {
        generation: generation,
        currentFrame: currentFrame,
        currentTime: currentTime,
        averageHistory: averageHistory,
        bestHistory: bestHistory,
        agentsData: agentsData,
        foodBlobsData: foodBlobsData,
        corpsesData: corpsesData
    }

    var saveJson = JSON.stringify(saveData);
    return saveJson;
}

function loadPopulation(saveJson) {
    reset();
    var saveData = JSON.parse(saveJson);

    for(var i = 0; i < saveData.foodBlobsData.length; i++) {
        let data = saveData.foodBlobsData[i];
        let food = new FoodBlob(data.x, data.y);
        foodBlobs.push(food);
    }

    for(var i = 0; i < saveData.agentsData.length; i++) {
        let data = saveData.agentsData[i];
        let network = new neuralNet.NeuralNet(settings.network.numInputs, settings.network.numOutputs, settings.network.numHiddenLayers, settings.network.neuronsPerHiddenLayer, settings.network.bias, settings.network.activationFunction);
        network.replaceWeights(data.weights);
        let agent = new Agent(data.x, data.y, data.orientation, data.fullness, settings.simulation.agentHungerRate,
            network, data.elite);
        population.push(agent);
    }

    for(var i = 0; i < saveData.corpsesData.length; i++) {
        let data = saveData.corpsesData[i];
        let corpse = new Corpse(data.x, data.y);
        corpse.timer = data.timer;
        corpses.push(corpse);
    }

    generation = saveData.generation;
    currentFrame = saveData.currentFrame;
    currentTime = saveData.currentTime;
    averageHistory = saveData.averageHistory;
    bestHistory = saveData.bestHistory;

    runGeneration(false);
}


/* CLASSES
 ***************************************************/

// Agents are the core of the simulation. They are individual entities with their own neural networks which determine
// how the agents input (senses) affects its outputs (movement). Agents "eat" food to survive, and the ones that perform
// best (eat the most food) are selected to undergo genetic crossover (combination of the genetic code of successful
// agents), which results in a new generation of agents.
class Agent {

	constructor(x, y, orientation, fullness, hungerRate, network, elite) {
		this.x = x;
		this.y = y;
		this.orientation = orientation;
		this.fullness = fullness;
		this.hungerRate = hungerRate;

		this.network = network;
		this.foodCollected = 0;

		this.moveHistory = [{x: this.x, y: this.y}];
		this.selected = false;
		this.elite = elite;

        this.dead = false;
	}

	// Update the agent
	update(currentFrame) {
		// If overfeeding is turned on and the agent has too much food, kill it
		if(settings.simulation.agentOverfeeding && this.fullness >= settings.simulation.agentOverfeedAmount) {
            this.die();
            return;
        }


		// Collect all of the agents inputs (senses) to be sent to its brain
		// Each agent has two senses: the direction of the closest food, and the direction that the agent is moving in
		var inputs = [];
		var foodVector = this.getClosestFoodVector();
		var directionVector = this.getDirectionVector();
		inputs.push(foodVector.x);
		inputs.push(foodVector.y);
		inputs.push(directionVector.x);
		inputs.push(directionVector.y);

		// Obtain the movements/reactions from the agents neural network (brain) for the given inputs (senses)
		var outputs = this.network.update(inputs);

		// Based on what movement mode is set in the settings, calculate the actual movement speed from the outputs
		if(settings.simulation.agentTankMovement) {
			var forwardSpeed = (outputs[0] + outputs[1]) * settings.simulation.agentSpeedModifier;
			var turnSpeed = (outputs[0] - outputs[1]) * settings.simulation.agentTurnModifier;
		} else {
			var forwardSpeed = outputs[0] * settings.simulation.agentSpeedModifier;
			var turnSpeed = ((outputs[1] * 2) - 1) * settings.simulation.agentTurnModifier;
		}

		// Calculate the agents new velocity and move it accordingly
		var xVelocity = forwardSpeed * Math.sin(this.orientation);
		var yVelocity = forwardSpeed * Math.cos(this.orientation);

		this.x += xVelocity * settings.simulation.simSpeedModifier;
		this.y += yVelocity * settings.simulation.simSpeedModifier;
		this.orientation += turnSpeed * settings.simulation.simSpeedModifier;

		// If the agent has moved outside of the world, wrap its position around
		if(this.x > settings.simulation.worldWidth || this.x < 0 || this.y > settings.simulation.worldHeight|| this.y < 0) {
			if(this.x > settings.simulation.worldWidth) {
				this.x = 0;
			} else if(this.x < 0) {
				this.x = settings.simulation.worldWidth;
			}

			if(this.y > settings.simulation.worldHeight) {
				this.y = 0;
			} else if(this.y < 0) {
				this.y = settings.simulation.worldHeight;
			}

			this.moveHistory = [{x: this.x, y: this.y}];
		}

		// Check for collisions with food
		for(var i = 0; i < foodBlobs.length; i++) {
			if(circleCollision(this.x, this.y, settings.simulation.agentSize, foodBlobs[i].x, foodBlobs[i].y, settings.simulation.foodBlobSize)) {
				this.fullness = utils.clamp(this.fullness + settings.simulation.foodValue, 0, settings.simulation.agentMaxFullness);
				this.foodCollected += 1;
				totalFoodEaten += 1;

				foodBlobs.splice(i, 1);
			}
		}

		// Decrease the agents fullness by its hunger rate
		if(settings.simulation.agentNeedsFood) {
			var speedHungerFactor = (forwardSpeed / settings.simulation.agentSpeedModifier) * settings.simulation.speedHungerModifier;
			this.fullness -= this.hungerRate * settings.simulation.simSpeedModifier * speedHungerFactor;
		}

		// If the agent has starved, kill it
		if(this.fullness <= 0) {
			this.die();
			return;
		}

		// Update the record of the agents movements which is used to draw the trailWidth
		if(settings.drawWorld.drawTrails && currentFrame % 3 === 0) {
			this.moveHistory.push({x: this.x, y: this.y});
			if(this.moveHistory.length > settings.drawWorld.maxTrailLength) {
				this.moveHistory.shift();
			}
		}
	}

	// Draw the agent
	draw(canvas) {
		// Set the transparency of the agent based on its hunger
		if(settings.simulation.agentOverfeeding && this.fullness > 100) {
			canvas.globalAlpha = (200 - this.fullness) / 100;
		} else {
			canvas.globalAlpha = this.fullness / settings.simulation.agentMaxFullness;
		}

		// Draw the agents body
		if(this.elite) {
			canvas.fillStyle = settings.drawWorld.eliteAgentColour;
		} else {
			canvas.fillStyle = settings.drawWorld.agentColour;
		}
		canvas.strokeStyle = settings.drawWorld.agentLineColour;
		canvas.lineWidth = settings.drawWorld.agentLineWidth;
		canvas.beginPath();
		canvas.arc(this.x, this.y, settings.simulation.agentSize, 0, 2 * Math.PI, false);
		canvas.closePath();
		canvas.fill();
		canvas.stroke();

		// Draw the number indicating how much food the agent has eaten
		if(settings.drawWorld.drawFoodLabels) {
			canvas.fillStyle = settings.drawWorld.foodLabelColour;
			canvas.fontSize = settings.drawWorld.foodLabelFontSize;
            canvas.fontFamily = settings.drawWorld.foodLabelFontFamily;
			canvas.fillText(this.foodCollected, this.x - 10, this.y + 10);
		}

		canvas.globalAlpha = 1;
	}

	// Draw the trail behind the agent
	drawTrail(canvas) {
		if(settings.drawWorld.drawTrails) {
			canvas.strokeStyle = settings.drawWorld.trailColour;
			canvas.lineWidth = settings.drawWorld.trailWidth;

			for(var i = this.moveHistory.length - 2; i >= 0; i--) {
                canvas.globalAlpha = i / (this.moveHistory.length - 2);
                canvas.beginPath();
                canvas.moveTo(this.moveHistory[i + 1].x, this.moveHistory[i + 1].y);
                canvas.lineTo(this.moveHistory[i].x, this.moveHistory[i].y);
                canvas.stroke();
			}

			canvas.globalAlpha = 1;
		}
	}

	// Returns a vector that points to the closest food blob to the agent
	getClosestFoodVector() {
		var closestFood = closestFoodTo(this.x, this.y);

		return utils.normaliseVector({x: closestFood.x - this.x, y: closestFood.y - this.y});
	}

	// Returns a vector of the direction the agent is moving in
	getDirectionVector() {
		return {x: -Math.sin(this.orientation), y: Math.cos(this.orientation)};
	}

	// Remove the agent from the population and create a corpse object
	die() {
        this.dead = true;
		var index = population.indexOf(this)
		population.splice(index, 1);
		species.removeGenome(index);

		corpses.push(new Corpse(this.x, this.y));
    }

	// If there is an agent that intersects with the given coordinates, returns it. Otherwise returns undefined
	static getAgentAt(x, y) {
		var closestDistance = 9999;
		var closest;

		for(var i = 0; i < population.length; i++) {
			var distance = utils.distance(x, y, population[i].x, population[i].y);

			if(distance < closestDistance) {
				closestDistance = distance;
				closest = population[i];
			}
		}

		if(closest != undefined)
			return closest;
		else
			return false;
	}

}

// Corpses are created when an agent dies, then shortly fade away
class Corpse {

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.timer = settings.simulation.corpseDuration;
	}

	// Update the corpse
	update(currentFrame) {
        // Decrease the timer
		this.timer -= settings.simulation.corpseFadeRate * settings.simulation.simSpeedModifier;

        // Once the timer reaches 0, destroy the corpse
		if(this.timer <= 0)
			corpses.splice(corpses.indexOf(this), 1);
	}

	// Draw the corpse
	draw(canvas) {
		canvas.globalAlpha = this.timer / settings.simulation.corpseDuration;
		canvas.fillStyle = settings.drawWorld.corpseColour;
		canvas.strokeStyle = settings.drawWorld.corpseLineColour;
		canvas.lineWidth = settings.drawWorld.corpseLineWidth;

		canvas.beginPath();
		canvas.arc(this.x, this.y, settings.simulation.agentSize, 0, 2 * Math.PI, false);
		canvas.closePath();
		canvas.fill();
		canvas.stroke();
		canvas.globalAlpha = 1;
	}
}

// Food blob objects are spawned randomly in the world, and provide food to agents on collision
class FoodBlob {

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	// Draw the food blob
	draw(canvas) {
		canvas.fillStyle = settings.drawWorld.foodBlobColour;
		canvas.strokeStyle = settings.drawWorld.foodBlobLineColour;
		canvas.lineWidth = settings.drawWorld.foodBlobLineWidth;

		canvas.beginPath();
		canvas.arc(this.x, this.y, settings.simulation.foodBlobSize, 0, 2 * Math.PI, false);
		canvas.closePath();
		canvas.fill();
		canvas.stroke();
	}

}


/* EVENTS
 ***************************************************/

// Events are placed in a document.ready wrapper to ensure that the relevant DOM elements have loaded before the script
// references them
$(document).ready(function() {

	/* CANVAS MOUSE EVENTS
	 ***************************************************/

	// When the user moves the cursor, update the stored mouse position
	$("#simCanvas").mousemove(function(event) {
		var rect = simCanvas.element.getBoundingClientRect();
		mousePos = {
			x: (event.clientX - rect.left),
			y: (event.clientY - rect.top)
		};
	});

	// When the user presses the right mouse button down, start dragging the canvas
	$("#simCanvas").mousedown(function(event) {
        if(event.which == 3) {
            draggingSimCanvas = true;
        }
	});

	// When the user releases the mouse, stop dragging the canvas
	$(document).mouseup(function(event) {
        if(event.which == 3) {
            draggingSimCanvas = false;
        }
	});

	// When the user clicks on the canvas, check if an agent is under the cursor, and if it is, select it
	$("#simCanvas").click(function(event) {
		var agent = Agent.getAgentAt(simCanvas.worldPosX(mousePos.x), simCanvas.worldPosY(mousePos.y));
		if(agent) {
			selectAgent(agent);
		}
	});

	// When the user scrolls on the canvas, zoom in or out
	$("#simCanvas").on("wheel", function(event) {
		var deltaZoom = event.originalEvent.deltaY * settings.drawWorld.zoomSpeedModifier;
		simCanvas.zoom = utils.clamp(
			simCanvas.zoom - simCanvas.zoom * deltaZoom,
			settings.drawWorld.minZoom,
			settings.drawWorld.maxZoom
		);
	});


	/* KEYBOARD EVENTS
	 ***************************************************/

	// When a key is pressed down, add it to the pressedKeys array
	$(document).keydown(function(event) {
		if(pressedKeys.indexOf(event.which) == -1) {
			pressedKeys.push(event.which);
		}
	});

	// When a key is released, remove it from the pressedKeys array
	$(document).keyup(function(event) {
		var index = pressedKeys.indexOf(event.which);
		if(index != -1) {
			pressedKeys.splice(index, 1);
		}
	});


	/* UI EVENTS
	 ***************************************************/

	// When the draw button is clicked, toggle drawing
	$("#drawButton").click(function(event) {
		togglePause();
		if(settings.drawWorld.draw) {
			$("#drawButton").text("Stop drawing");
			$(simCanvas.element).removeClass("disabled");
		} else {
			$("#drawButton").text("Start drawing");
			$(simCanvas.element).addClass("disabled");
		}
	});

	// When the pause button is clicked, toggle pausing
	$("#pauseButton").click(function() {
		paused = !paused;
		if(paused) {
			$("#pauseButton").html("Play");
		} else {
			$("#pauseButton").html("Pause");
		}
	});

    // When the user changes the speed slider, change the simulation speed
    $(document).on("input", "#timeScale", function() {
        settings.simulation.simSpeedModifier = $("#timeScale").val() / 100;
    });

    // When the simulation button is clicked, show the simulation tab
    $("#simulationButton").click(function() {
        $("#simulation").show();
        $("#about").hide();
        $("#simulationButton").addClass("selected");
        $("#aboutButton").removeClass("selected");

        var save = saveCurrentPopulation();
        loadPopulation(save);

    });

    // When the about button is clicked, show the about tab
    $("#aboutButton").click(function() {
        $("#about").show();
        $("#simulation").hide();
        $("#simulationButton").removeClass("selected");
        $("#aboutButton").addClass("selected");
    });

    // When the restart button is clicked, restart the simulation
    $("#restartButton").click(function() {
        reset();
        runGeneration();
    });

    // When the best agent button is clicked, select the agent that has collected the most food
    $("#bestAgentButton").click(function() {
        var agent = getBestAgent();
        if(agent) {
            selectAgent(agent);
        }
    });

	var saveData;

	$("#saveButton").click(function() {
		saveData = saveCurrentPopulation();
	});

	$("#loadButton").click(function() {
		if(saveData != undefined) {
			loadPopulation(saveData);
		}
	});


	/* OTHER EVENTS
	 ***************************************************/

	// Prevent the right click context menu from opening
    $(document).contextmenu(function(event) {
        return false;
    });

	// When the window is resized, resize the canvas accordingly (cannot be done through CSS without stretching
	// the context)
	$(window).resize(function() {
		simCanvas.elementWidth = window.innerWidth - $("#inspector").outerWidth();
		simCanvas.elementHeight = window.innerHeight - $("#topBar").outerHeight();
		simCanvas.applyScale();
	});

	// Run the initial function that kick-starts the simulation
	init();

});