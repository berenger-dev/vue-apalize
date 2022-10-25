import type { I18n } from 'vue-i18n'

import Apalize from "apalize.js";

declare type Config = { i18n?: I18n, application_id: string; host?: string };
declare type TranslationValue = { locale: string; value: string };
declare type Translation = { key: string, values: TranslationValue[] };

export const createApalize = (config: Config) => {
    return {
        install: (app) => {
            const init_mount = app.mount;
            app.mount = async (containerOrSelector: any) => {
                const apalize = await Apalize({
                    application_id: config.application_id,
                    host: config.host
                });

                const translations = convertToVueI18n(apalize.translations);

                Object.keys(translations).forEach(locale => {
                    config.i18n.global.setLocaleMessage(locale, translations[locale]);
                });

                const t = config.i18n.global.t;
                config.i18n.global.t = (key: string, ...values: any[]) => {
                    const translation = t(key, ...values);
                    if (apalize) apalize.translate(key);

                    return translation;
                }

                return init_mount(containerOrSelector);
            }
        }
    }
}

const convertToVueI18n = (translations: Translation[]) => {
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