import axios from 'axios';
import Jsona from 'jsona';
import qs from 'qs';
import authHeader from './auth-header';
const url = process.env.VUE_APP_API_V1_BASE_URL;
const dataFormatter = new Jsona();

export default {

    async list(params) {
        const options = {
            params: params,
            paramsSerializer: function (params) {
            return qs.stringify(params, {encode: false});
            },
            headers: authHeader()
        };

        return axios.get(`${url}/video-jobs`, options)
            .then(response => {
                if (undefined === response.data.meta) {
                    var meta = {'page':  { 'total': 1 }};
                }
            return {
                list: dataFormatter.deserialize(response.data),
                meta: meta ? meta : response.data.meta
            };
            });
    },

    async get(id) {
    const options = {
        headers: authHeader()
    };

    return axios.get(`${url}/video-jobs/${id}?include=modelfile,user`, options)
        .then(response => {
        let item = dataFormatter.deserialize(response.data);
        delete item.links;
        return item;
        });
    },

    async add(item) {

    const payload = dataFormatter.serialize({
        stuff: item,
        includeNames: ['modelfile']
    });

    const options = {
        headers: authHeader()
    };

    return axios.post(`${url}/video-jobs?include=modelfile,user`, payload, options)
        .then(response => {
        return dataFormatter.deserialize(response.data);
        });
    },

    async update(item) {
    const payload = dataFormatter.serialize({
        stuff: item,
        includeNames: []
    });


    const options = {
        headers: authHeader()
    };

    return axios.patch(`${url}/video-jobs/${item.id}?include=modelfile,user`, payload, options)
        .then(response => {
        return dataFormatter.deserialize(response.data);
        });
    },

    async destroy(id) {

    const options = {
        headers: authHeader()
    };

    return axios.delete(`${url}/video-jobs/${id}`, options);
    },

    async upload(item, image) {

    const bodyFormData = new FormData();
    bodyFormData.append('attachment', image);

    return axios.post(`${url}/uploads/video-jobs/${item.id}/image`, bodyFormData)
        .then(response => {
        return response.data.url;
        });
    }

}