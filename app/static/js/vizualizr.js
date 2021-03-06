$SCRIPT_ROOT = {{ request.script_root|tojson|safe }};

		$(window).load(function() {


// GENERAL TO-DOS - 
//		Have user choose whether they want to upload a file or use streaming before prompting them to upload?


			// Initialize globals

			// Unset contourData for each page load
			$.contourData = undefined;
			// Initialize contourData object
		    $.contourData = {};
		    
		    // Initialize audioData as an array
		    $.audioData = [];
		    // Set window size for analysis comparison
		    $.audioWindowSize = 10;
		    // Set threshold for color and image updates
		    $.pitchThreshold = 500;

		    // Set canvas/contexts
		    $.contourCanvas = document.getElementById( "contours" );
			$.contourContext = $.contourCanvas.getContext( "2d" );

			$.imageCanvas = document.getElementById( "images" );
            $.imageContext = $.imageCanvas.getContext( "2d" );

            $.note = document.getElementById('note').innerHTML;
            $.previousNote = "A";

// TO-DO - set loading image that is replace once init() is called


			/**
			 * Get contours from Python
			 */
			function getContourArray() {	

				$.ajax({
		            type: "GET",
		            url: $SCRIPT_ROOT + "/upload",
		            data: { processContours: 1 },
		            contentType: "application/json; charset=utf-8",
		           	success: function( allContourData ) {
		            	
		            	allContourData = jQuery.parseJSON( allContourData );
		            	
		            	// Set contour data to global $.contourData.contourArray
		            	setContourArray( allContourData );
		            	
		            	beginProcessing();

		            }
		        }); 

		    	return false;

			}

			getContourArray();


			/**
			 * Add contours to globals
			 */
			function setContourArray( allContourData ) {

				// All contour data
				$.contourData.contourArray = allContourData;
				
				// Sets which contour should be rendered, constantly updated as the audio plays
				$.contourData.currentContour = 0;

				// Number of contours that appear on the canvas
				$.contourData.contoursInPlace = 0;

			}

			$.contourData.imagesInPlace = 0;

			function beginProcessing() {
			
				// Let's get going! 
				init();


				function init() {

// TO-DO - hide the loading image
					// render 30 times a second (should also look 
					// at requestAnimationFrame) 
					setInterval(update,1000/5);

				}


				/**
				 * Update contours and colors
				 *
				 * Store pitch audio data for ongoing analysis
				 */
				function update() {
					
					// Is the app picking up audio?
					// If so, has the note value changed since the last iteration?
					if(
						$.note !== '--' 
						&& 
						$.note !== '-' 
						&& 
						$.note !== $.previousNote
					) {

		            	// Get next user image
	// TO-DO - get all user images dynamically - set first to img in dom, save second+ in userImages object
			            var img = new Image();
			            img.src = "http://127.0.0.1:5000/static/images/user/sun-large.jpg";

			            img.onload = function(){

							drawContour();

							updateImage( img );

						}
					}

				}


				/**
				 * Returns a random integer between min and max
				 */
				function getRandomInt (min, max) {

				    return Math.floor( Math.random() * (max - min + 1) ) + min;

				}


				/**
				 * Returns an rgba(0,0,0,0) string based on pitch and note values of audio
				 */
				function updateColor() {
					
					// Get pitch value
					var pitch = document.getElementById('pitch').innerHTML;

					// Set color temperature based on pitch
					colorTemp = 'cool';
// TO-DO - need to dynamically set pitch threshold, instead of using static 500 $.pitchThreshold ?
					if(pitch > $.pitchThreshold) colorTemp = 'warm';

// TO-DO - set color values based on colors within next (second, third, fourth, etc) image using Python or JS - getDominantColors() below?
					// Set color based on temperature
					if(colorTemp == 'warm') {
						// Generate warm color
						// red 		255,0,0
						// orange 	255,165,0
						// yellow 	255,255,0
						colorR = getRandomInt( 205, 255 );
						colorG = getRandomInt( 0, 255 );
						colorB = 0;
					
					} else {
						// Generate cool color
						// blue 	0,0,255
						// green 	0,128,0 
						// lime  	0,255,0 
						// purple 	128,0,128
						// magenta 	255,0,255
						colorR = 0;
						colorG = getRandomInt( 0, 255 );
						colorB = getRandomInt( 205, 255 );
					}

					$.previousNote = $.note;

					// Set opacity and contour
					opacity = 0.28;
					switch($.note) {
						case "A":
						case "A#":
							opacity = 0.84;
						break;
						case "B":
							opacity = 0.98;
						break;
						case "C":
						case "C#":
							opacity = 0.14;
						break;
						case "D":
						case "D#":
							opacity = 0.28;
						break;
						case "E":
						case "E#":
							opacity = 0.42;
						break;
						case "F":
						case "F#":
							opacity = 0.56;
						break;
						case "G":
						case "G#":
							opacity = 0.70;
						break;
					}

					return "rgba("+colorR+","+colorG+","+colorB+","+opacity+")";
		        
		        }


		        /**
		         * Draw contour on canvas
		         */
				function drawContour() {
					
					// Set fill color
					$.contourContext.fillStyle = updateColor();

					$.contourContext.beginPath();

					// Get contour
					thisContour = $.contourData.contourArray[0][$.contourData.currentContour]["py/numpy.ndarray"]["values"];

					for (var i = 0; i < thisContour.length; i++) {
						$.contourContext.lineTo(thisContour[i][0][0],thisContour[i][0][1]);
					};

					$.contourContext.fill();

					// Set new contour for next time
					setNextContour();

				}


		        /**
		         * Increment current contour being used and how many are in place
		         */
		        function setNextContour() {

					if($.contourData.contoursInPlace >= ($.contourData.contourArray[0].length * 1.25)) {
						
						// Reset contour
						$.contourData.contoursInPlace = 0;

						// Clear all contours in context
						$.contourContext.clearRect(0, 0, $.contourCanvas.width, $.contourCanvas.height);

					} else {

						$.contourData.contoursInPlace++;

					}

					// Track the number of image updates made 
					// Reset if necessary
					if($.contourData.currentContour >= ($.contourData.contourArray[0].length - 1)) {

                    	//$.contourData.imagesInPlace = 0;
                    	$.contourData.currentContour = 0;
                    
                    } else {
                    
                    	//$.contourData.imagesInPlace++;
                    	$.contourData.currentContour++;
                    
                    }

		        }


				/**
		         * Draw contours of new image on existing 
		         */
				function updateImage( img ) {

					if($.contourData.imagesInPlace < 1) {

                    	$.imageContext.clearRect(0, 0, $.imageCanvas.width, $.imageCanvas.height);
					
					}

					var contourLength = $.contourData.contourArray[0].length - 1;

                	$.imageContext.save();

                    $.imageContext.beginPath();

                    // Create mask with contour
                    thisContour = $.contourData.contourArray[0][$.contourData.imagesInPlace]["py/numpy.ndarray"]["values"];

					for ( var i = 0; i < thisContour.length; i++ ) {
						$.imageContext.lineTo(thisContour[i][0][0],thisContour[i][0][1]);
					};

					$.imageContext.closePath();
                    
                    // Apply mask
                    $.imageContext.clip();
                    
                    // Display portion of new image
                    $.imageContext.drawImage(img,0,0);

                    // Restore context to original state
                    // This allows multiple contours to be drawn
                    $.imageContext.restore();


					// Track the number of image updates made 
					// Reset if necessary
					if($.contourData.imagesInPlace >= contourLength) {

                    	$.contourData.imagesInPlace = 0;
                    
                    } else {
                    
                    	$.contourData.imagesInPlace++
                    
                    }

	        	}


	        	/**
		         * Iterate through pixels and get dominant colors from image
		         */
	        	function getDominantColors() {

	        		var img = new Image();
		            img.src = "http://127.0.0.1:5000/static/images/user/sun-large.jpg";

		            //$.imageContext.drawImage(img,0,0);

				    var c = document.createElement('canvas');

				    var w = img.width, h = img.height;

				    c.width = w;
				    c.height = h;

				    var ctx = c.getContext('2d');

				    ctx.drawImage(img, 0, 0, w, h);
				    var imageData = ctx.getImageData(0,0, w, h);
				    var pixel = imageData.data;

				    var r=0, g=1, b=2, a=3;
				    
				    for ( var p = 0; p < pixel.length; p+=4 ) {
				      
				      /*
				      if (
				          pixel[p+r] == 255 &&
				          pixel[p+g] == 255 &&
				          pixel[p+b] == 255) // if white then change alpha to 0
				      {
				      	pixel[p+a] = 0;
				      	console.log(pixel);
				      }
				      */
// TO-DO - create array of colors, increment as we come across duplicates. Use incremented values in array search to find most used colors				      

				    }

				    //ctx.putImageData(imageData,0,0);

				    //return c.toDataURL('image/png');

				    return true;

				}

			}

		});

/*

MISC TO-DOs


## take frequency range in first 4 seconds as norm ? 
## how to define first time period ? 
	# when more than one pitch is encountered ?
	# when loudness increases and stays consistent for 1-2 seconds?

## evaluate frequency
	# what is the standard range?
# If the frequencies in the audio data window include a large range, 
# the application will use a geometric composition with a large number of shapes. 
# An audio data window with a short frequency range will use less complex geometric compositions. 

## evaluate pitch
	# how many pitches should we expect to encounter in a piece of music ?
	# how many frequencies does each pitch encompass?
# significant change calls ________ function - same as frequency above?

## evaluate tempo
	# how much change in tempo is typical versus significant?
# significant change calls imageTransition() ?
# significant change calls geometricTransition() ? The faster the tempo the more complex the geometric image ?

## evaluate decibels / loudness
	# what is the standard range?
# Alternative if tempo determination is not accurate:
	# The rate in which the imagery changes will be determined by the decibels of the audio. 
	# High decibels will create faster image changes, while lower decibels will create more gradual image changes.

## how to determine when the music is changing (for example - moving from verse to chorus) ?
## when to set a new norm to base decisions off ?
	# look for significant changes that stay consistent for 4 seconds?
		# use pitch for traditional pop songs ?

*/
