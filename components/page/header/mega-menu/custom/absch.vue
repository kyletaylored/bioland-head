<template>
    <div class="col-12 text-wrap px-0">
        <PageHeaderMegaMenuHeader  :menu="menu" />

        <PageHeaderMegaMenuLink v-for="(aMenu,j) in menu.children" :key="j" :menu="aMenu" />
    </div>
</template>
<i18n src="@/i18n/dist/components/page/header/mega-menu/custom/absch.json"></i18n>
<script>
    import { unLocales } from "~/util";
    import { useSiteStore } from "~/stores/site";
    import { useMenusStore } from "~/stores/menus";

    export default {
        name: 'PageHeaderMegaMenuAbsch',

        setup
    }

    async function setup() {
        const { t , locale } = useI18n();
        const siteStore      = useSiteStore();
        const menuStore      = useMenusStore();
        const country        = siteStore.config?.countries?.length? [...siteStore.config.countries, siteStore.config?.country] : siteStore.config?.country




        const { absch:data } = storeToRefs(menuStore);
        const children       = makeMenu(data.value,t, siteStore.name,country, locale.value)
        const menu           = ref({ title: t('absch'), href: 'https://absch.cbd.int', class: ['main-nav-sub-heading', 'arrow'], children });

        
        

        return { t, menu, data }
    }

    function makeMenu(data,t, name, passedCountry, passedLocale){
        const locale  = unLocales.includes(passedLocale.toLocaleLowerCase())? passedLocale.toLocaleLowerCase() : 'en';
        const country = Array.isArray(passedCountry)? passedCountry.map((c)=>`&country=${c}`).join('')  : `&country=${passedCountry}`;
        const schemas = ['measure', 'absProcedure', 'absNationalModelContractualClause', 'absPermit', 'database', 'absCheckpoint']
        const menus   = [];

        for (const schemaName in data) {

            if(!schemas.includes(schemaName)) continue;
            menus.push({
                            title: t(schemaName),
                            href : data[schemaName].href,
                            count: data[schemaName].count,
                            target:'_blank'
                        })
        }

        menus.push({
            title: `${name} ${t('view')}`,
            href : `https://absch.cbd.int/${locale}/search?${country}`,
            class: ['main-nav-final-link'],
            target:'_blank'
        })
        return ref(menus)
    }
</script>