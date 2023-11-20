import { paramCase } from "param-case";

export const useContentTypeCounts = async (ctx) => {
    await useDrupalLogin(ctx.identifier)
    const allCounts = await Promise.all([getAllContentCounts(ctx), getAllMediaCounts(ctx)])

    return makeTypeMap(allCounts.flat())
}

export const useContentTypeMenus = async (ctx) => {
    await useDrupalLogin(ctx.identifier)
    return  makeTypeMap(await getAllContentTypeMenus(ctx))
}

async function getContentMenus (ctx, drupalInternalId) {
    const { localizedHost } = ctx;
    const uri           = `${localizedHost}/jsonapi/node/content?jsonapi_include=1&include=field_type_placement,field_attachments.field_media_image&filter[taxonomy_term--tags][condition][path]=field_type_placement.drupal_internal__tid&filter[taxonomy_term--tags][condition][operator]=IN&filter[taxonomy_term--tags][condition][value][]=${drupalInternalId}&page[limit]=7&sort[sort-created][path]=created&sort[sticky][path]=sticky`;
    const method        = 'get';
    const headers       = { 'Content-Type': 'application/json' };

    const { data } = await $fetch(uri, { method, headers });


    return data.map(mapThumbNails(ctx))
};

function makeTypeMap(data){
    const map = {};

    for(const item of data)
        map[item.slug] = item
    
    return map;
}
function mapThumbNails(ctx){
    return (document)=>{

        const isArray        = Array.isArray(document?.field_attachments)
        const attachments    = isArray? document?.field_attachments?.filter(({ type })=> type === 'media--image') : []
        const hasAttachments = attachments?.length > 0;

        document.thumb  = '/images/no-image.png';

        const { thumb, title, path, created, changed, field_start_date } = document;

        if(!hasAttachments) return { thumb, title, href: path.alias };

        const { uri } = attachments[0].field_media_image;

        document.thumb  = `${ctx.host}${uri.url}`


        return { thumb:document.thumb, title, href: path.alias, created, changed, startDate:field_start_date };
    }
}

async function getAllContentTypeMenus(ctx){
    const terms    = await getTerms(ctx);


    const requests = [];

    for(const term of terms){
        const aRequest = getContentMenus(ctx, term.drupalInternalId).then(( data )=> ({ ...term, data }))

        requests.push(aRequest)
    }

    return Promise.all(requests);
}

async function getTerms ({ localizedHost }) {
    const uri           = `${localizedHost}/jsonapi/taxonomy_term/tags?jsonapi_include=1`;
    const method        = 'get';
    const headers       = { 'Content-Type': 'application/json' };

    const { data } = await $fetch(uri, { method, headers });


    return data.filter(({ status })=> status)
                .map(({ drupal_internal__tid:drupalInternalId, name })=> ({ drupalInternalId, name, slug: paramCase(name) }))
};

async function getMediaTypes ({ identifier, localizedHost }) {
    const uri   = `${localizedHost}/jsonapi/media_type/media_type?jsonapi_include=1`;

    const $http = await useDrupalLogin(identifier)


    const { body }  = await $http.get(uri).withCredentials().accept('json')


    return body.data
                .map(({ drupal_internal__id:drupalInternalId, label:name })=> ({ drupalInternalId, name, slug: paramCase(name) }))
};

async function getAllContentCounts(ctx){
    const terms    = await getTerms(ctx);
    const requests = [];

    for(const term of terms){
        const aRequest = getContentCounts(ctx, term.drupalInternalId).then(( { count } )=> ({ ...term, count }))

        requests.push(aRequest)
    }

    return Promise.all(requests);
}

async function getContentCounts ({ localizedHost }, drupalInternalId) {

    const uri           = `${localizedHost}/jsonapi/node/content?jsonapi_include=1&include=field_type_placement&filter[taxonomy_term--tags][condition][path]=field_type_placement.drupal_internal__tid&filter[taxonomy_term--tags][condition][operator]=IN&filter[taxonomy_term--tags][condition][value][]=${drupalInternalId}&page[limit]=1`;
    const method        = 'get';
    const headers       = { 'Content-Type': 'application/json' };

    const { meta } = await $fetch(uri, { method, headers });


    return meta
};



async function getAllMediaCounts (ctx) {
    const mediaTypes    = await getMediaTypes(ctx);


    const requests = [];
    
    for(const term of mediaTypes){
     
        if(!term?.drupalInternalId) throw new Error(`getAllMediaCounts -> ${term.name} does not have a drupalInternalId`);
        const aRequest = getMediaCounts(ctx, term.drupalInternalId).then(( { count } )=> ({ ...term, count }))

        requests.push(aRequest)
    }

    return Promise.all(requests);
};


async function getMediaCounts ({ localizedHost }, mediaType) {

    const uri           = `${localizedHost}/jsonapi/media/${mediaType}?jsonapi_include=1&page[limit]=1`;
    const method        = 'get';
    const headers       = { 'Content-Type': 'application/json' };

    const { meta } = await $fetch(uri, { method, headers });


    return meta
};