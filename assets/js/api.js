(function () {
  const API_BASE_URL = 'https://ht-admin-api-stg.bienapp.in/api/home/webinar';

  const ENDPOINTS = {
    banners: `${API_BASE_URL}/banner-list`,
    videos: `${API_BASE_URL}/video-list`,
    classes: `${API_BASE_URL}/class-list`,
    testimonials: `${API_BASE_URL}/testimonial-list`,
  };

  /**
   * Fetches JSON from a webinar endpoint and normalizes the response into an array.
   * The backend sends useful data in `info`, so every caller gets the same shape.
   */
  async function fetchWebinarList(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || payload.success_status !== true || !Array.isArray(payload.info)) {
      throw new Error('Unexpected API response format');
    }

    return payload.info;
  }

  function getBannerList() {
    return fetchWebinarList(ENDPOINTS.banners);
  }

  function getVideoList() {
    return fetchWebinarList(ENDPOINTS.videos);
  }

  function getClassList() {
    return fetchWebinarList(ENDPOINTS.classes);
  }

  function getTestimonialList() {
    return fetchWebinarList(ENDPOINTS.testimonials);
  }

  window.WebinarAPI = {
    getBannerList,
    getVideoList,
    getClassList,
    getTestimonialList,
  };
}());
