import axios from 'axios';

export default {
    methods:{
        forceFileDownload(response, title) {
            const new_url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a')
            link.href = new_url
            link.setAttribute('download', title)
            document.body.appendChild(link)
            link.click()
        },
    
        downloadWithAxios(url, title) {
            axios({
                method: 'get',
                url,
                responseType: 'arraybuffer',
            })
                .then((response) => {
                    this.forceFileDownload(response, title)
                })
                .catch(() => console.log('error occured'))
        },
    }
}
