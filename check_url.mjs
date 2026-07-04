const url = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1/audio_library?select=*&limit=1';
const apikey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

fetch(url, {
  headers: {
    'apikey': apikey,
    'Authorization': 'Bearer ' + apikey
  }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
