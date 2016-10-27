/* settings.js
 ***************************************************
 *
 * This script is responsible for storing various settings for both the simulation and the drawing.
 *
 ***************************************************/

// A global variable that encapsulates all settings
var settings = {
    drawWorld: {
        draw: true,

        backgroundColour: "#000000",
        worldColour: "#05374b",

        agentColour: "#009cff",
        eliteAgentColour: "#0441ff",
        agentLineWidth: 1,
        agentLineColour: "#0000FF",

        corpseColour: "#9c5240",
        corpseLineWidth: 0,
        corpseLineColour: "#BFBFBF",

        drawFoodLabels: true,
        foodLabelColour: "#FFFFFF",
        foodLabelFontSize: 30,
        foodLabelFontFamily: "Helvetica",

        foodBlobColour: "#00BB00",
        foodBlobLineWidth: 0,
        foodBlobLineColour: "#00FF00",

        drawTrails: true,
        maxTrailLength: 50,
        trailWidth: 2,
        trailColour: "#FFFFFF",

        drawSelection: true,
        selectionLineWidth: 5,
        selectionLineColour: "#FF0000",

        updatesPerDraw: 1,

        framesPerSecond: 1000,

        updatesPerStatDraw: 30,

        zoomSpeedModifier: 0.001,
        minZoom: 0.1,
        maxZoom: 1.5,
        keyScrollSpeed: 10,

        newSimulationTextTimer: 100
    },

    //various settings for controlling all graphing on the graph canvas
    drawGraph: {
        canvasWidth: 285,
        canvasHeight: 185,

        draw: true,
        drawOnPause: true,

        vertScaleFactor: 0.1,
        horzScaleFactor: 10,
        autoScaleHorz: true,
        autoScaleVert: true,

        markSpacing: 10,

        backgroundColour: "#393939",

        averageColour: "#FFFFFF",
        bestColour: "#FF0000",
        markColour: "#707070"
    },

    //
    drawNetwork: {
        //dimensions of the canvas
        canvasWidth: 285,
        canvasHeight: 185,

        draw: true,
        redraw: true,

        //colours for network elements
        inputNodeColour: "#00FF00",
        hiddenNodeColour: "#909090",
        outputNodeColour: "#FF0000",
        connectionColour: "#97d7ff",
        negativeConnectionColour: "#fd8185",
        weightTextColour: "#0000FF",
        backgroundColour: "#393939",
        lastTextColour: "#FFFFFF",

        //size of each network node
        nodeSize: 10,

        //default width of each connection before being multiplied by its weight
        connectionWidth: 1,

        nodeOutlineColour: "black",
        nodeOutlineWidth: 0,

        //size of weight text
        textSize: "15",
        textFont: "Helvetica",

        //spacing parameters
        leftMargin: 20,
        topMargin: 20,
        spacing: 20,
        horzSpacingMod: 3,

        //what to draw
        drawNodes: true,
        drawConnections: true,
        drawWeights: false,
        drawLastOutput: false
    },

    //various settings for controlling the properties of the simulation
    simulation: {
        worldWidth: 2000,
        worldHeight: 2000,

        agentSize: 20,
        foodBlobSize: 10,
        maxAgentSpeed: 10,
        maxAgentTurnRate: 10,
        foodValue: 60,
        maxFood: 75,
        agentMaxFullness: 150,
        agentStartingFullness: 120,
        agentHungerRate: 0.15,
        speedHungerModifier: 0.6,
        agentNeedsFood: true,
        agentOverfeeding: false,
        agentOverfeedAmount: 200,
        corpseDuration: 200,
        corpseFadeRate: 0,
        numGenerations: 10000,
        generationLength: 1500,
        agentSpeedModifier: 5,
        agentTurnModifier: 0.4,
        agentTankMovement: true,
        simSpeedModifier: 1,
        minSpeedModifier: 0,
        maxSpeedModifier: 3,

        //minimum delay between update frames when not drawing
        frameDelay: 0,

        //minimum delay between update frames when drawing
        frameDelayDrawing: 1000 / 60
    },

    //various settings for constructing the neural networks used by each agent
    network: {
        numInputs: 4,
        numOutputs: 2,
        numHiddenLayers: 1,
        neuronsPerHiddenLayer: [6],
        bias: -1,
        activationFunction: neuralNet.activationFunctions.sigmoid
    },

    //various settings for the genetic algorithm that evolves the agents networks
    species: {
        populationSize: 50,
        mutationRate: 0.12,
        mutationMin: -0.5,
        mutationMax: 0.5,
        crossoverRate: 0.7,
        bitMin: -5,
        bitMax: 5,
        numElite: 4
    }
};