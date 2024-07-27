
class MovieDB {

    #apiKey;
    #params;
    #apiBaseUrl;
    #baseImageUrl;
    #filters;
    #sortBy;
    #sortTypes;
    #noMovieCountries;

    constructor(apiKey, params) {
        this.#apiKey = apiKey;
        // Initialize both private properties and parameters.
        this.#initProperties();
        this.#params = params === undefined ? {} : params;
        this.#initParams();

        // Set the sortBy property. 
        this.#sortBy = this.#params.sort_by;
    }

    // Private functions.

    #initProperties() {
        this.#apiBaseUrl = 'https://api.themoviedb.org/3/';
        this.#baseImageUrl = 'https://image.tmdb.org/t/p/';
        this.#filters = { 'genres': [], 'years': [], 'countries': [] };
        this.#sortBy = '';
        this.#sortTypes = [
            {'value': 'original_title.asc', 'text': 'Original title asc'},
            {'value': 'original_title.desc', 'text': 'Original title desc'},
            {'value': 'popularity.asc', 'text': 'Popularity asc'},
            {'value': 'popularity.desc', 'text': 'Popularity desc'},
            {'value': 'revenue.asc', 'text': 'Revenue asc'},
            {'value': 'revenue.desc', 'text': 'Revenue desc'},
            {'value': 'primary_release_date.asc', 'text': 'Primary release date asc'},
            {'value': 'primary_release_date.desc', 'text': 'Primary release date desc'},
            {'value': 'title.asc', 'text': 'Title asc'},
            {'value': 'title.desc', 'text': 'Title desc'},
            {'value': 'vote_average.asc', 'text': 'Vote average asc'},
            {'value': 'vote_average.desc', 'text': 'Vote average desc'},
            {'value': 'vote_count.asc', 'text': 'Vote count asc'},
            {'value': 'vote_count.desc', 'text': 'Vote count desc'},
        ];
        // Countries that return no movie at all. Thus it's useless to use them in the country filter.
        this.#noMovieCountries = [
            'CK','HM','NF','PM','PN','PW','TF','ZR'
        ];
    }

    /*
     * Initializes the instance with the given parameters.
     * Sets it to a default value when no parameter is given.
     */
    #initParams() {
        //this.#params.apiKey = params.apiKey;
        this.#params.language = this.#params.language === undefined ? 'en-US' : this.#params.language;
        this.#params.include_adult = this.#params.include_adult === undefined ? false : this.#params.include_adult;
        this.#params.include_video = this.#params.include_video === undefined ? false : this.#params.include_video;
        this.#params.sort_by = this.#params.sort_by === undefined ? 'popularity.desc' : this.#params.sort_by;

    }

    // Generic function to get data from a given resource.
    async #getData(resource, responseType) {
        // Wait until the response promise returned by fetch is completed.
        const response = await fetch(resource);

        // Throw an error in case the response status is different from 200 (ie: OK).
        if (response.status !== 200) {
            throw new Error('Couldn\'t fetch the data. status: ' + response.status);
        }

        const type = responseType === undefined ? 'json' : responseType;
        // Wait until the promise returned by the response object is completed.
        const data = await response[type]();

        return data;
    }
    
    // Public functions.


    async getMovies(page) {
        // Set the page to display.
        page = page === undefined ? 1 : page;
        // Set the filters.
        const with_genres = this.#filters.genres.length ? '&with_genres=' + this.#filters.genres.join(',') : '';
        const primary_release_date = this.#filters.years.length ? '&primary_release_date.gte=' + this.#filters.years[0] + '-01-01&primary_release_date.lte=' + this.#filters.years[1] + '-12-31' : '';
        const with_origin_country = this.#filters.countries.length ? '&with_origin_country=' + this.#filters.countries.join('|') : '';

        // Build the resource.
        const resource = this.#apiBaseUrl + 'discover/movie?api_key=' +
                         this.#apiKey +
                         '&include_adult=' + this.#params.include_adult + 
                         '&include_video=' + this.#params.include_video + 
                         '&language=' + this.#params.language +
                         with_genres + 
                         '&sort_by=' + this.#sortBy + 
                         primary_release_date + 
                         with_origin_country + 
                         '&page=' + page;

        const data = await this.#getData(resource);

        return data;
    }

    async getMovie(id) {
        const resource = this.#apiBaseUrl + 'movie/' + id + '?api_key=' + this.#apiKey +
                        '&append_to_response=credits' + // cast + crew 
                        '&language=' + this.#params.language;

        const data = await this.#getData(resource);

        return data;
    }

    async getGenreList() {
        const resource = this.#apiBaseUrl + 'genre/movie/list?api_key=' +
                         this.#apiKey +
                         '&language=' + this.#params.language;

        const data = await this.#getData(resource);

        return data;
    }

    getGenres() {
        return this.#filters.genres;
    }

    addGenres(ids) {
        for (let i = 0; i < ids.length; i++) {
            this.#filters.genres.push(ids[i]);
        }
    }

    removeGenres(ids) {
        for (let i = 0; i < ids.length; i++) {
            this.#filters.genres = this.#filters.genres.filter(id => id !== ids[i]);
        }
    }

    resetGenres() {
        this.#filters.genres = [];
    }

    getYearList() {
        let years = [];
        let year = 1900;
        const currentYear = new Date().getFullYear();

        while (year < currentYear + 1) {
            years.push(year);
            year++;
        }

        return years;
    }

    setYears(years) {
        // Make sure the given parameter is valid.
        if (!Array.isArray(years) || years.length != 2) {
            console.log('Error: years parameter must be of type Array and must contained 2 elements.')
            return;
        }

        this.#filters.years = years;
    }

    getYears() {
        return this.#filters.years;
    }

    resetYears() {
        this.#filters.years = [];
    }

    async getCountryList() {
        const resource = this.#apiBaseUrl + 'configuration/countries?api_key=' +
                         this.#apiKey +
                         '&language=' + this.#params.language;

        const data = await this.#getData(resource);

        return data;
    }

    getCountries() {
        return this.#filters.countries;
    }

    updateCountries(countries) {
        // Make sure the given parameter is an array.
        if (!Array.isArray(countries)) {
            console.log('Error: countries parameter must be of type Array.')
            return;
        }

        this.#filters.countries = countries;
    }

    resetCountries() {
        this.#filters.countries = [];
    }

    getNoMovieCountries() {
        return this.#noMovieCountries;
    }

    getBaseImageUrl(size) {
        size = size === undefined ? '' : size;
        return this.#baseImageUrl + size;
    }

    getSortTypes() {
        return this.#sortTypes;
    }

    getSortBy() {
        return this.#sortBy;
    }

    setSortBy(sortType) {
        return this.#sortBy = sortType;
    }

    async searchByTitle(title, page) {
        page = page === undefined ? 1 : page;

        const resource = this.#apiBaseUrl + 'search/movie?api_key=' +
                         this.#apiKey + 
                         '&query=' + title +
                         '&page=' + page;

        const data = await this.#getData(resource);
        return data;
    }
}
