import type { I18n } from 'vue-i18n'
import type { Router } from 'vue-router'

import { nextTick } from 'vue'

import Apalize from "apalize.js";

let application_id = "";

declare type Config = { i18n: I18n, router: Router, application_id: string };
declare type TranslationValue = { locale: string; value: string };
declare type Translation  =  { key: string, values: TranslationValue[] };

export default function Main(config: Config) {
    setI18nLanguage(config.i18n);
    application_id = config.application_id;

    config.router.beforeEach(async (to, from, next) => {
        await loadLocaleMessages(config.i18n);
        setI18nLanguage(config.i18n);

        return next();
    });
}

export function setI18nLanguage(i18n: I18n) {
    const locale = i18n.global.locale.toString();

    const html_element = document?.querySelector('html');
    if (html_element) {
        html_element.setAttribute('lang', locale)
    }
}

let translations: any;

export async function loadLocaleMessages(i18n: I18n) {
    const locale = i18n.global.locale.toString();

    if (!translations) {
        const data = await Apalize({
            application_id: application_id
        });

        translations = convertToVueI18n(data.translations);
    }

    i18n.global.setLocaleMessage(locale, translations[locale]);

    return nextTick()
}

const convertToVueI18n = (translations:Translation[]) => {
    const messages: any = {};

    translations.forEach(translation => {
        const values = translation.values;
        values.forEach(value => {
            if (!messages[value.locale]) {
                messages[value.locale] = {};
            }

            const keys = translation.key.split(".");
            let obj = messages[value.locale];
            for (let i = 0; i < keys.length; i++) {
                if (i === keys.length - 1) {
                    obj[keys[i]] = value.value;
                } else {
                    if (!obj[keys[i]]) {
                        obj[keys[i]] = {};
                    }
                    obj = obj[keys[i]];
                }
            }
        });
    });

    return messages;
}