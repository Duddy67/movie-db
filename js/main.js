
// Source: https://github.com/samuelmideksa/movv

document.addEventListener('DOMContentLoaded', () => {

    // Get the user's authorization token.
    const authToken = getAuthToken();

    // Check the token is still active.
    if (authToken.length === 0) {
        // Redirect to the login page.
        window.location.replace(window.location.origin + '/movie-db/login.php');
    }

    let api = null;

    // Retrieve the tmdb api key.
    getApiKey(authToken).then(apiKey => {
        // Set some parameters.
        const params = {
            //'language': 'fr-FR',
            'include_adult': false,
        };

        // Create an TvShowDB instance.
        api = new MovieDB(apiKey, params);

        // Some filters can be set before the initial api call.
        // For instance, this will return the french movies with drama and comedy genre
        // and released from 1970 to 1977

        api.addGenres([18, 35]);
        //api.setYears([1970, 1977]);
        //api.updateCountries(['FR']);

        // Run the initial api call.
        return api.getMovies();
    }).then(data => {
        // Create the list with the retrieved data.
        buildMovieList(data, api);

        // Get the genre list from the tmdb api.
        return api.getGenreList();
    }).then(data => {
        // Create the genre button board.
        createGenreButtons(data.genres, api.getGenres());

        // Create some filters.

        createYearFilterLists(api);
        createSortTypeOptions(api);

        return api.getCountryList();
    }).then(data => {
        createCountryList(data, api);
    }).catch(error => {
        console.log('Promise rejected', error.message);
    });

    // Add event listeners to the application elements.

    // Listen to click events coming from inside the movie cards.
    document.getElementById('appendData').addEventListener('click', (e) => {
        // Get the actual card div element.
        const clickedCard = e.target.closest('.card-clickable');

        if (clickedCard) {
            // Fetch the movie from its id.
            api.getMovie(clickedCard.dataset.movieId).then(data => {
                // Display the movie details in a modal window.
                openMovieModal(data, api);
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        }
    });

    // Check for pagination.
    document.getElementById('more').addEventListener('click', (e) => {
        // Set the next page number.
        e.target.dataset.page = parseInt(e.target.dataset.page) + 1;

        // Get the next page of search result.
        if (document.getElementById('searchKey').value.length) {
            api.searchByTitle(document.getElementById('searchKey').value, e.target.dataset.page).then(data => {
                buildMovieList(data, api);
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        }
        // Get the next movie page.
        else {
            api.getMovies(e.target.dataset.page).then(data => {
                buildMovieList(data, api);
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        }
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
                api.addGenres([parseInt(e.target.dataset.genreId)]);
            }
            else {
                // Remove the genre id from the genre filter.
                api.removeGenres([parseInt(e.target.dataset.genreId)]);
            }

            resetMovieList(api);
        }
    });

    // Check for reset buttons.
    document.querySelectorAll('.reset-btn').forEach((button) => {
        button.addEventListener('click', (e) => {
            // 
            if (e.target.dataset.resetType == 'genres') {
                api.resetGenres();
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
                api.resetYears();

                // Set the drop down lists to their initial state.
                toYear.value = '';
                fromYear.value = '';
                toYear.disabled = true;
            }

            if (e.target.dataset.resetType == 'countries') {
                api.resetCountries();
                document.getElementById('countries').selectedIndex = -1;
            }

            if (e.target.dataset.resetType == 'search') {
                // Reset all the search parameters.
                document.getElementById('searchByTitle').value = '';
                document.getElementById('searchKey').value = '';
                // Display the filters again.
                document.getElementById('filters').style.display = 'block';
            }

            resetMovieList(api);
        });
    });

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

            api.setYears([fromYear.value, toYear.value]);
        }

        // The fromYear select value has changed and is empty (ie: the default 'Select a year' option). 
        if (e.target.id == 'fromYear' && !fromYear.value) {
            // Set the toYear drop down list to its initial state.
            toYear.value = fromYear.value;
            toYear.disabled = true;

            api.resetYears();
        }

        // The toYear select value has changed.
        if (e.target.id == 'toYear') {
            api.setYears([fromYear.value, toYear.value]);
        }

        resetMovieList(api);
    });

    document.getElementById('filterByCountries').addEventListener('click', (e) => {
        const select = e.target.parentElement;
        let countries = [];

        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].selected) {
                countries.push(select.options[i].value);
            }
        }

        api.updateCountries(countries);
        resetMovieList(api);
    });

    // Check for the change of sort type.
    document.getElementById('sortBy').addEventListener('change', (e) => {
        api.setSortBy(e.target.value);
        resetMovieList(api);
    });

    // Check for the search by title.
    document.getElementById('searchByTitle').addEventListener('keydown', (e) => {
        let searchKey = e.target.value;

        // The Enter key has been pressed. 
        if (e.keyCode == 13) {
            // Remove all the movies from the list.
            document.getElementById('appendData').innerHTML = '';

            // Run the search.
            api.searchByTitle(searchKey).then(data => {
                // Set the hidden input search key.
                document.getElementById('searchKey').value = searchKey;
                buildMovieList(data, api);
                // Hide the filters as they are not taken into account when seaching.
                document.getElementById('filters').style.display = 'none';
            }).catch(error => {
                console.log('Promise rejected', error.message);
            });
        }
    });
});


function getAuthToken() {
    const name = 'auth_token';
    // Retrieve the authentication token from the session cookie
    return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
}

async function getApiKey(authToken) {
    // Make a request to your PHP endpoint with the authentication token
    const response = await fetch(window.location.origin + '/movie-db/backend/data.php', {
                               method: 'GET',
                               headers: {
                                   'Authorization': `Bearer ${authToken}`
                               }
                           });

    // Throw an error in case the response status is different from 200 (ie: OK).
    if (response.status !== 200) {
        throw new Error('Couldn\'t fetch the data. status: ' + response.status);
    }

    const result = await response.text();

    if (result.startsWith('Error')) {
        throw new Error('Couldn\'t get the api key: ' + result);
    }

    return result;
}

function resetMovieList(api) {
    // Remove all the movies from the list.
    document.getElementById('appendData').innerHTML = '';

    // Get the movies.
    api.getMovies().then(data => {
        buildMovieList(data, api);
    }).catch(error => {
        console.log('Promise rejected', error.message);
    });
}

function createGenreButtons(genres, selected) {
    // Loop through the genre list.
    genres.forEach((genre) => {
        // First create a column container for the button.
        let column = document.createElement('div');
        column.className = 'col-md-2 mb-2';

        // Check if genre is already selected.
        const isSelected = selected.includes(genre.id) ? 1 : 0;

        // Create the genre button.

        let button = document.createElement('button');
        // Set the button class accordingly.
        const btnStyle = isSelected ? 'primary' : 'secondary';
        button.className = 'btn btn-' + btnStyle + ' btn-genre';
        button.setAttribute('id', genre.id);
        button.setAttribute('type', 'button');
        button.setAttribute('data-genre-id', genre.id);
        button.setAttribute('data-selected', isSelected);
        const buttonName = document.createTextNode(genre.name);
        button.appendChild(buttonName);

        // Append the button to its container.
        column.appendChild(button);
        // Append the column button to the genre container.
        document.getElementById('genres').appendChild(column);
    });
}

function createYearFilterLists(api) {
    // Create the fromYear and toYear drop down lists.
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

    // Append the option to both drop down lists.
    fromYear.appendChild(option);
    toYear.appendChild(option.cloneNode(true));

    const years = api.getYearList();
    const selected = api.getYears();

    // Loop through the year list.
    years.forEach((year) => {
        option = document.createElement('option');
        option.value = year;
        option.text = year;

        // Clone the created option to append it to the second drop down list (toYear).
        let clone = option.cloneNode(true);

        // Check if the year has been selected.
        if (selected.length && selected[0] == year) {
            option.setAttribute('selected', true);
        }

        fromYear.appendChild(option);

        // Check if the year has been selected.
        if (selected.length && selected[1] == year) {
            clone.setAttribute('selected', true);
            toYear.disabled = false;
        }

        toYear.appendChild(clone);
    });

    let fromLabel = document.createElement('label');
    fromLabel.setAttribute('for', 'fromYear');
    fromLabel.appendChild(document.createTextNode('From first air year'));

    document.getElementById('fromYearList').appendChild(fromLabel);
    document.getElementById('fromYearList').appendChild(fromYear);

    let toLabel = document.createElement('label');
    toLabel.setAttribute('for', 'toYear');
    toLabel.appendChild(document.createTextNode('To first air year'));

    document.getElementById('toYearList').appendChild(toLabel);
    document.getElementById('toYearList').appendChild(toYear);
}

function createCountryList(countries, api) {
    let label = document.createElement('label');
    label.setAttribute('for', 'countries');
    label.appendChild(document.createTextNode('Countries'));

    let select = document.createElement('select');
    select.className = 'form-select';
    select.setAttribute('name', 'countries');
    select.setAttribute('id', 'countries');
    select.setAttribute('multiple', 'multiple');

    const noMovieCountries = api.getNoMovieCountries();
    const selected = api.getCountries();

    countries.forEach((country) => {
        if (!noMovieCountries.includes(country.iso_3166_1)) {
            let option = document.createElement('option');
            option.value = country.iso_3166_1;
            option.text = country.native_name;

            if (selected.includes(country.iso_3166_1)) {
                option.selected = true;
            }

            select.appendChild(option);
        }
    });

    document.getElementById('filterByCountries').appendChild(label);
    document.getElementById('filterByCountries').appendChild(select);
}

function buildMovieList(data, api) {

    data.results.forEach((value, index, array) => {
        // Create the movie card.
        let card = document.createElement('div');
        card.className = 'card card-clickable col-lg-3 col-md-4 col-sm-6 my-3 mx-auto';
        card.style.width = '13rem';
        card.style.padding = '0';
        // To store the movie id.
        card.setAttribute('data-movie-id', value.id); 

        let cardImage = document.createElement('img');
        cardImage.className = 'card-img-top img-fluid';
        let posterUrl = `${api.getBaseImageUrl('w500')}${value.poster_path}`;
        cardImage.setAttribute('src', posterUrl);
        cardImage.style.height = 'auto';
        cardImage.style.width = '100%';

        let cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        let cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title fw-bold';
        cardTitle.textContent = value.title;

        let cardText = document.createElement('p');
        cardText.className = 'card-text fs-6 mb-1';
        cardText.textContent = value.release_date;

        let cardVote = document.createElement('p');
        cardVote.className = 'card-text fs-6';
        cardVote.textContent = 'Vote: ' + value.vote_average.toFixed(1);

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);
        cardBody.appendChild(cardVote);
        card.appendChild(cardImage);
        card.appendChild(cardBody);
        document.getElementById('appendData').appendChild(card);
    });

    if (document.getElementById('appendData').childNodes.length == 0 || document.getElementById('appendData').childNodes.length < 20 || data.results.length == 0) {
        // Hide the "More" button if the list is empty or has less than 20 movies or the given data is empty.
        document.getElementById('more').style.display = 'none';
    }
    else {
        document.getElementById('more').style.display = 'block';
    }
}

function createSortTypeOptions(api) {
    const sortTypes = api.getSortTypes();
    const sortBy = document.getElementById('sortBy');

    sortTypes.forEach((sortType) => {
        option = document.createElement('option');
        option.value = sortType.value;
        option.text = sortType.text;

        if (sortType.value == api.getSortBy()) {
            option.setAttribute('selected', true);
        }

        sortBy.appendChild(option);
    });

}

// Function to open the modal and populate it with movie details
function openMovieModal(movie, api) {
    const modalTitle = document.getElementById('movieModalLabel');
    const modalPoster = document.getElementById('modalPoster');
    const modalReleaseDate = document.getElementById('modalReleaseDate');
    const modalRuntime = document.getElementById('modalRuntime');
    const modalOverview = document.getElementById('modalOverview');
    const modalDirector = document.getElementById('modalDirector');
    const modalCasting = document.getElementById('modalCasting');
    const modalVoteAverage = document.getElementById('modalVoteAverage');

    // Get the casting (the 4 first actors) and the director name.

    let casting = '';

    for (let i = 0; i < movie.credits.cast.length; i++) {
        casting = casting + movie.credits.cast[i].name;

        if (i < 3) {
            casting = casting + ', ';
        }
        else {
            casting = casting + '...';
            break;
        }
    }

    let director = movie.credits.crew.filter(function(crew) { return crew.job == 'Director'; });

    // Populate modal
    modalTitle.textContent = `${movie.title} (${new Date(movie.release_date).getFullYear()})`;
    modalPoster.src = `${api.getBaseImageUrl('w500')}${movie.poster_path}`;
    modalReleaseDate.textContent = movie.release_date;
    modalRuntime.textContent = `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`;
    modalOverview.textContent = movie.overview;
    modalDirector.textContent = director[0].name;
    modalCasting.textContent = casting;
    modalVoteAverage.textContent = movie.vote_average.toFixed(1);

    // Open the modal
    const movieModal = new bootstrap.Modal(document.getElementById('movieModal'));
    movieModal.show();
}

