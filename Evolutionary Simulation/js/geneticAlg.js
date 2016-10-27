/* geneticAlg.js
 ***************************************************
 *
 * This script provides two classes which can be used to manage and advance a population of data containers using
 * crossover and mutation.
 *
 ***************************************************/

var geneticAlg = {

	// A species object manages a population of genomes, and provides the mechanisms to crossover and mutate genomes,
	// calculate their fitness, select genomes probabilistically based on their fitness, and advance generations
	Species: class {

		constructor(popSize, mutationRate, mutationMin, mutationMax, crossoverRate, chromoLength, geneMin, geneMax, numElite) {
			this.population = [];
			this.populationSize = popSize;
			this.chromoLength = chromoLength;

			// Per generation current statistics
			this.totalFitness = 0;
			this.bestFitness = 0;
			this.averageFitness = 0;
			this.worstFitness = 0;

			// Reference to the best genome this generation
			this.bestGenome = undefined;

			// The probability that an element of a chromosome will mutate
			this.mutationRate = mutationRate;

			// The range of random numbers by which a chromosomes genes will be multiplied when it mutates
			this.mutationMin = mutationMin;
			this.mutationMax = mutationMax;

			// The probability that chromosomes will cross over elements
			this.crossoverRate = crossoverRate;

			// The minimum and maximum values of a chromosome gene
			this.geneMin = geneMin;
			this.geneMax = geneMax;

			// The number of best genomes that will be directly transferred over to the next generation
			// Elite genomes are the best genomes of a generation and are directly brought across to the next
			this.numElite = numElite;

			this.currentGeneration = 0;

			this.createGenomes(this.populationSize, this.chromoLength, this.geneMin, this.geneMax);
		}

		// Crosses over the genes of the given parent genomes and assigns the results to the baby genome, based on the
		// crossover rate
		crossOver(parent1, parent2, baby, crossoverRate) {
			if(Math.random() <= crossoverRate) {
				// Choose a crossover point somewhere in the chromosome. Genes after this point are swapped with those
				// from the other parent
				var crossOverPoint = utils.randBetween(0, parent1.chromo.length - 1);

				// For each gene
				for(var i = 0; i < parent1.chromo.length; i++) {
					// Assign the baby's genes based on whether they are before or after the crossover point
					if(i < crossOverPoint) {
						baby.chromo[i] = parent1.chromo[i];
					} else {
						baby.chromo[i] = parent2.chromo[i];
					}
				}
			// If crossover will not occur, just copy the genes of the first parent
			} else {
				for(var i = 0; i < parent1.chromo.length; i++) {
					baby.chromo[i] = parent1.chromo[i];
				}
			}
		}

		// Mutates the chromosomes of the given genome based on the mutation rate
		mutate(genome, mutationRate, mutationMin, mutationMax) {
			// For each gene
			for(var i = 0; i < genome.chromo.length; i++) {
				if(Math.random() <= mutationRate) {
					// Change the genes value by a random number between mutationMin and mutationMax
					genome.chromo[i] += utils.randBetweenFloat(mutationMin, mutationMax);
				}
			}
		}

		// Clamps the chromosomes genes to the acceptable range to stop runaway mutations
		limit(genome, geneMin, geneMax) {
			// For each gene
			for(var i = 0; i < genome.chromo.length; i++) {
				genome.chromo[i] = utils.clamp(genome.chromo[i], geneMin, geneMax)
			}
		}
		
		// Select a genome using roulette-wheel selection based on fitness
		// -  Each genome has a chance of being selected based on its fitness
		selectGenome(population) {
			var total = 0;

			// The probabilities of each genome being selected (all of which sum to 1)
			var adjustedProbs = [];

			// For each genome
			for(var i = 0; i < population.length; i++) {
				// Add its fitness to the total fitness
				total += population[i].fitness;
			}

			// For each genome
			for(var i = 0; i < population.length; i++) {
				// Divide its fitness by the total to normalise all probabilities to add to 1
				adjustedProbs.push(population[i].fitness / total);
			}

			var rand = Math.random();

			// The current search position, used to find the genome that has been selected
			var searchPos = 0;

			// For each genome
			for(var i = 0; i < population.length; i++) {
				// Add its probability to the searchPos
				searchPos += adjustedProbs[i];

				// If the current probability is greater than the chosen random number
				if(searchPos >= rand) {
					// Choose this genome
					return population[i];
				}
			}
		}

		// Returns the genome with the highest fitness, along with that fitness
		getBest() {
			var best = this.population[0];
			var bestIndex = 0;

			for(var i = 0; i < this.population.length; i++) {
				if(this.population[i].fitness > best.fitness) {
					best = this.population[i];
					bestIndex = i;
				}
			}

			return {obj: best, index: bestIndex};
		}

		// Returns the nth best genome and its index (e.g. 5 would return the 5th best)
		getNthBest(n) {
			var sortedPopulation = utils.copyArray(this.population);
			sortedPopulation.sort(function(a, b) {
				if(a.fitness > b.fitness)
					return -1;
				if(b.fitness > a.fitness)
					return 1;
				return 0;
			});

			var nthBest = sortedPopulation[n];
			return {obj: nthBest, index: this.population.indexOf(nthBest)};
		}

		// Returns the average fitness of the current population
		getAverageFitness() {
			var average = 0;

			for(var i = 0; i < this.population.length; i++) {
				average += this.population[i].fitness;
			}

			average /= this.population.length;
			return average;
		}

		// Advances the population by one generation
		advanceGeneration() {
			var newPopulation = [];

			// For each new genome to be created
			for(var i = 0; i < this.populationSize - this.numElite; i++) {
				// Select two random parents based on their fitness
				var parent1 = this.selectGenome(this.population);
				var parent2 = this.selectGenome(this.population);

				// Create the new baby genome
				var baby = new geneticAlg.Genome(parent1.chromoLength, this.geneMin, this.geneMax);

				// Crossover the genes of the parents into the baby
				this.crossOver(parent1, parent2, baby, this.crossoverRate);

				// Mutate the baby's genes
				this.mutate(baby, this.mutationRate, this.mutationMin, this.mutationMax);

				// Clamp the baby's genes to the acceptable range
				this.limit(baby, this.geneMin, this.geneMax);

				newPopulation.push(baby);
			}

			// Bring across numElite elite genomes
			// - Elite genomes are the best genomes of the previous generation, which are brought across directly
			for(var i = 0; i < this.numElite; i++) {
				var iBest = this.getNthBest(i).obj;
				if(iBest) {
					iBest.elite = true;
					newPopulation.push(iBest);
				}

			}

			// Destroy the current population
			this.population.length = 0;

			// Transfer the new population to the current population
			for(var i = 0; i < this.populationSize; i++) {
				this.population[i] = newPopulation[i];
			}
		}

		// Creates a new population of genomes with random genes
		createGenomes(num, chromoLength, geneMin, geneMax) {
			for(var i = 0; i < num; i++) {
				this.population.push(new geneticAlg.Genome(chromoLength, geneMin, geneMax));
			}
		}

		// Removes the genome at index from the population and adjusts the populations size accordingly
		removeGenome(index) {
			this.population.splice(index, 1);
		}

	},

	// A single genetic entity with its own stored genetic data (genes) and fitness
	Genome: class {

		constructor(chromoLength, geneMin, geneMax) {
			// The sequence of genes that defines the genome
			this.chromo = [];

			this.chromoLength = chromoLength;

			// The previous output of this genome
			this.previousOutput;

			// The fitness of this genome this generation
			this.fitness;

			// Whether this genome has been marked as elite
			this.elite;

			// Initialise with random genes
			for(var i = 0; i < chromoLength; i++) {
				this.chromo.push(utils.randBetweenFloat(geneMin, geneMax));
			}
		}

	}

};