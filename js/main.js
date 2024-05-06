
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'API_KEY';
    // Base URL for TMDb images with size preference w500
    const baseImageUrl = 'https://image.tmdb.org/t/p/w500';

    const params = {
        'language': 'fr-FR', 
        'include_adult': true,
    };

    const movieDB = new MovieDB.init(apiKey, params);

    // Some filters can be set before the initial api call.
    // For instance, this wil return the movies with drama and comedy genre 
    // and released from 1970 to 1977

    movieDB.addGenres([18, 35]);
    movieDB.setYears([1970, 1977]);

    // Run the initial api call.
    movieDB.getMovies().then(data => {
        buildMovieList(data, baseImageUrl);
    }).catch(error => {
        console.log('Promise rejected', error.message);
    });

    // Listen to click events coming from inside the movie cards.
    document.getElementById('appendData').addEventListener('click', (e) => {
        // Get the actual card div element.
        const clickedCard = e.target.closest('.card-clickable');

        if (clickedCard) {
            // Fetch the movie from its id.
            movieDB.getMovie(clickedCard.dataset.movieId).then(data => {
                // Display the movie details in a modal window.
                openMovieModal(data, baseImageUrl);
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        }
    });

    // Check for pagination.
    document.getElementById('see-more').addEventListener('click', (e) => {
        // Set the next page number.
        e.target.dataset.page = parseInt(e.target.dataset.page) + 1;

        movieDB.getMovies(e.target.dataset.page).then(data => {
            buildMovieList(data, baseImageUrl);
        }).catch(error => {
            console.log('Promise rejected', error.message);
        });
    });

    // Listen to click events from genre buttons.
    document.getElementById('genres').addEventListener('click', (e) => {
        // Make sure the clicked element is a button.
        if (e.target.tagName == 'BUTTON') {
            // Toggle the button selected value
            e.target.dataset.selected = parseInt(e.target.dataset.selected) ? 0 : 1;

            // Set the button appearence accordingly.
            if (parseInt(e.target.dataset.selected)) {
                e.target.classList.remove('btn-secondary');
                e.target.classList.add('btn-primary');
            }
            else {
                e.target.classList.remove('btn-primary');
                e.target.classList.add('btn-secondary');
            }

            if (parseInt(e.target.dataset.selected)) {
                // Add the genre id to the genre filter.
                movieDB.addGenres([parseInt(e.target.dataset.genreId)]);
            }
            else {
                // Remove the genre id from the genre filter.
                movieDB.removeGenres([parseInt(e.target.dataset.genreId)]);
            }

            // Remove the movies from the list.
            document.getElementById('appendData').innerHTML = '';

            // Get the new movie list filtered by genre.
            movieDB.getMovies().then(data => {
                buildMovieList(data, baseImageUrl);
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        }
    });

    // Check for reset buttons.
    document.querySelectorAll('.reset-btn').forEach((button) => {
        button.addEventListener('click', (e) => {

            // Remove all the movie list.
            document.getElementById('appendData').innerHTML = '';

            if (e.target.dataset.resetType == 'genres') {
                movieDB.resetGenres();
                let buttons = document.getElementById('genres').querySelectorAll('button');

                // Set the genre buttons to the unselect state.
                buttons.forEach((button) => {
                    if (parseInt(button.dataset.selected)) {
                        button.dataset.selected = 0;
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-secondary');
                    }
                });
            }

            if (e.target.dataset.resetType == 'years') {
                movieDB.resetYears();

                // Set the drop down lists to their initial state.
                toYear.value = '';
                fromYear.value = '';
                toYear.disabled = true;
            }

            // Get the new movie list.
            movieDB.getMovies().then(data => {
                buildMovieList(data, baseImageUrl);
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        });
    });

    // Get the genre list from the API then build the genre buttons.
    movieDB.getGenreList().then(data => {
        createGenreButtons(data.genres, movieDB.getGenres());
    }).catch(error => {
        console.log('Promise rejected: ', error.message);
    });

    createYearFilterLists(movieDB.getYearList());

    // Checks for change events in the fromYear and toYear drop down lists. 
    document.getElementById('filterByYears').addEventListener('change', (e) => {
        // Get the drop down lists according to the target.
        const fromYear = e.target.id == 'fromYear' ? e.target : document.getElementById('fromYear');
        const toYear = e.target.id == 'toYear' ? e.target : document.getElementById('toYear');

        // The fromYear select value has changed and is not empty. 
        if (e.target.id == 'fromYear' && fromYear.value) {
            toYear.disabled = false;

            if (toYear.value == '' || toYear.value < fromYear.value) {
                // Filter movies by single year.
                toYear.value = fromYear.value;
            }

            // Update the toYear options so that the years lower than the one in fromYear can't be selected.
            for (let i = 0; i < toYear.options.length; i++) {
                if (toYear.options[i].value < fromYear.value) {
                    toYear.options[i].disabled = true;
                }
                else {
                    toYear.options[i].disabled = false;
                }
            }

            movieDB.setYears([fromYear.value, toYear.value]);
        }

        // The fromYear select value has changed and is empty (ie: the default 'Select a year' option). 
        if (e.target.id == 'fromYear' && !fromYear.value) {
            // Set the toYear drop down list to its initial state.
            toYear.value = fromYear.value;
            toYear.disabled = true;

            movieDB.resetYears();
        }

        // The toYear select value has changed.
        if (e.target.id == 'toYear') {
            movieDB.setYears([fromYear.value, toYear.value]);
        }

        // Remove all the movie list.
        document.getElementById('appendData').innerHTML = '';

        // Get the movies filtered by year or range of years.
        movieDB.getMovies().then(data => {
            buildMovieList(data, baseImageUrl);
        }).catch(error => {
            console.log('Promise rejected', error.message);
        });
    });
});


function createGenreButtons(genres, selected) {
    genres.forEach((genre) => {
        let column = document.createElement('div');
        column.className = 'col-md-2 mb-2';
        const isSelected = selected.includes(genre.id) ? 1 : 0;

        let button = document.createElement('button');
        const btnStyle = isSelected ? 'primary' : 'secondary';
        button.className = 'btn btn-' + btnStyle + ' btn-genre';
        button.setAttribute('id', genre.id);
        button.setAttribute('type', 'button');
        button.setAttribute('data-genre-id', genre.id);
        button.setAttribute('data-selected', isSelected);
        const buttonName = document.createTextNode(genre.name);
        button.appendChild(buttonName);

        column.appendChild(button);
        document.getElementById('genres').appendChild(column);
    });
}

function createYearFilterLists(years) {
    let fromYear = document.createElement('select');
    fromYear.className = 'form-select';
    fromYear.setAttribute('name', 'fromYear');
    fromYear.setAttribute('id', 'fromYear');

    let toYear = document.createElement('select');
    toYear.className = 'form-select';
    toYear.setAttribute('name', 'toYear');
    toYear.setAttribute('id', 'toYear');
    // The toYear select list is always disabled at first.
    toYear.setAttribute('disabled', true);

    // Build the first option.
    let option = document.createElement('option');
    option.value = '';
    option.text = 'Select a year';

    fromYear.appendChild(option);
    toYear.appendChild(option.cloneNode(true));

    years.forEach((year) => {
        option = document.createElement('option');
        option.value = year;
        option.text = year;

        fromYear.appendChild(option);
        toYear.appendChild(option.cloneNode(true));
    });

    document.getElementById('fromYearList').appendChild(fromYear);
    document.getElementById('toYearList').appendChild(toYear);
}

function buildMovieList(data, baseImageUrl) {

    data.results.forEach((value, index, array) => {
        let card = document.createElement('div');
        card.className = 'card card-clickable col-lg-3 col-md-4 col-sm-6 my-3 mx-auto';
        card.style.width = '13rem';
        card.style.padding = '0';
        card.setAttribute('data-movie-id', value.id); // to store movie id

        let cardImage = document.createElement('img');
        cardImage.className = 'card-img-top img-fluid';
        let posterUrl = `${baseImageUrl}${value.poster_path}`;
        cardImage.setAttribute('src', posterUrl);
        cardImage.style.height = 'auto';
        cardImage.style.width = '100%';

        let cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        let cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.textContent = value.title;

        let cardText = document.createElement('p');
        cardText.className = 'card-text fs-6';
        cardText.textContent = value.release_date;

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);
        card.appendChild(cardImage);
        card.appendChild(cardBody);
        document.getElementById('appendData').appendChild(card);
    });
}

// Function to open the modal and populate it with movie details
function openMovieModal(movie, baseImageUrl) {
    const modalTitle = document.getElementById('movieModalLabel');
    const modalPoster = document.getElementById('modalPoster');
    const modalReleaseDate = document.getElementById('modalReleaseDate');
    const modalRuntime = document.getElementById('modalRuntime');
    const modalOverview = document.getElementById('modalOverview');
    const modalVoteAverage = document.getElementById('modalVoteAverage');

    // Populate modal
    modalTitle.textContent = `${movie.title} (${new Date(movie.release_date).getFullYear()})`;
    modalPoster.src = `${baseImageUrl}${movie.poster_path}`;
    modalReleaseDate.textContent = movie.release_date;
    modalRuntime.textContent = `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`;
    modalOverview.textContent = movie.overview;
    modalVoteAverage.textContent = movie.vote_average;

    // Open the modal
    const movieModal = new bootstrap.Modal(document.getElementById('movieModal'));
    movieModal.show();
}

