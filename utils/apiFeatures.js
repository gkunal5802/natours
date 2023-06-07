class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) FILTERING
    const queryObj = { ...this.queryString };
    const excludedFields = ['limit', 'page', 'sort'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\bgte|gt|lte|lt\b/g, (match) => `$${match}`);

    // This is called filtering. OR querying the getAllTours method
    this.query = this.query.find(JSON.parse(queryStr));

    return this; // it is necessary so that other methods can be chained after one another.
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      console.log(fields);
      this.query = this.query.select(fields); // select helps to project only certain properties.
    } else {
      this.query = this.query.select('-__v'); // it means excluding field
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // tours?page=2&limit=10 -> 1-10 on page 1, 11-20 on page 2
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
