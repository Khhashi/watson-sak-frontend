import type { DokumentInnhold } from "~/saker/filer/typer";
import {
  celle,
  dokumentHeader,
  h1,
  h2,
  h3,
  mal,
  p,
  pMedVariabler,
  rad,
  tabell,
  ul,
  variabel,
} from "./node-builders";

/** Anmeldelse til politiet for bedrageri og uriktig forklaring (AAP og utlandsopphold). */
export function anmeldelsemal(): DokumentInnhold {
  return mal([
    dokumentHeader(
      "Anmeldelse",
      "jf. offl. § 24 andre ledd andre punktum, jf. § 13, jf. Nav-loven § 7",
    ),
    tabell(
      rad(celle("Til:"), celle("[Sted] politidistrikt, [postboks], [postnummer]")),
      rad(celle("Dato:"), celle(pMedVariabler(variabel("dagens-dato")))),
      rad(celle("Deres referanse:"), celle("")),
      rad(celle("Vår referanse:"), celle(pMedVariabler(variabel("saksnummer")))),
      rad(celle("PID:"), celle(pMedVariabler(variabel("fødselsnummer")))),
      rad(celle("Saksbehandler:"), celle(pMedVariabler(variabel("saksbehandler")))),
    ),

    h1(
      "Anmeldelse for bedrageri, ev. grovt bedrageri og uriktig forklaring. [Ev. medvirkning til bedrageri, ev. grovt bedrageri og uriktig forklaring]",
    ),
    pMedVariabler("Navn: ", variabel("navn")),
    pMedVariabler("Fødselsnummer: ", variabel("fødselsnummer")),
    p("Adresse: "),
    p("[Ev. adresse på gjerningstidspunktet:] "),
    p("E-post/telefonnummer: "),
    p("[Ev. medvirker:]"),
    p("[Navn: ]"),
    p("[Fødselsnummer: ]"),
    p("[Adresse: ]"),
    p("[Ev. adresse på gjerningstidspunktet: ]"),
    p("[E-post/telefonnummer: ]"),

    h1("Innledning"),
    pMedVariabler(
      "Nav kontroll ",
      variabel("avdeling"),
      " anmelder [stønadsmottaker] for bedrageri, jf. straffeloven § 371 bokstav b, ev. grovt bedrageri, straffeloven §§ 372, jf. 371 bokstav b, og uriktig forklaring, straffeloven § 221 første ledd bokstav d. Vi mener [stønadsmottaker], med forsett om å skaffe seg eller andre en uberettiget vinning, har holdt tilbake opplysninger / har gitt uriktige opplysninger på meldekort om at han/hun oppholdt seg i utlandet (oppgi land utenfor EØS), samtidig som han/hun har mottatt arbeidsavklaringspenger (AAP).",
    ),
    p(
      "[stønadsmottaker] har på dette grunnlag rettstridig påvirket resultatet av en automatisk databehandling og dermed urettmessig mottatt AAP for perioden [dato – dato] med brutto [beløp] kroner.",
    ),
    p("[Ved flere perioder bør tabell benyttes.]"),
    p("[Hvis aktuelt:]"),
    pMedVariabler(
      "Nav kontroll ",
      variabel("avdeling"),
      " anmelder [navn] for medvirkning til bedrageri etter straffeloven § 371 bokstav b, jf. § 15, ev. grovt bedrageri etter straffeloven § 372, jf. § 371 bokstav b, jf. § 15, [alternativt også § 221 første ledd bokstav d, jf. § 15.] Vi mener [navn] har gitt uriktige opplysninger om utlandsopphold og på den måten medvirket til det [straffbare forhold].",
    ),
    p("Beregning av anmeldt beløp følger i vedlegg x."),

    h1("Faktiske opplysninger"),
    p(
      "[I dette avsnittet skal du gi en objektiv fremstilling av de faktiske forhold i saken. Husk dokumenthenvisning!]",
    ),

    h2("Språkforståelse"),
    p("[Hvis aktuelt:]"),
    p(
      "Opplysninger fra Folkeregisteret viser at [stønadsmottaker] innvandret til Norge fra [land] [dato]. Det kommer frem av Aa-registeret at [stønadsmottaker] har lang/kort yrkeserfaring som [yrke] i Norge / tatt utdanning i Norge. [stønadsmottaker] har hatt kontakt med Nav-kontoret, både digitalt/på telefon/ved personlig fremmøte i perioden fra [dato] til [dato]. Det kommer ikke frem opplysninger om språklige utfordringer.",
    ),

    h2("Sivilhistorikk"),
    p("[Hvis aktuelt]"),

    h2("Stønadshistorikk"),
    p("[Du skal redegjøre for relevante hendelser/dokumenter, for eksempel:]"),
    ul([
      "[krav/søknader, vedtak, utbetalingshistorikk]",
      "[informasjon bruker har fått om rettigheter og plikter]",
      "[om det er søkt om utlandsopphold utenfor EØS]",
      "[aktivitetsplaner]",
      "[opplysninger bruker har fått og gitt i samtaler, m.m., for eksempel dialog i Modia, notater, henvendelser fra bruker, manglende oppmøte]",
      "[legeerklæringer tar du med dersom innholdet er av betydning for saken]",
      "[post i retur]",
      "[tidligere stønadsforhold kun dersom det er relevant, for eksempel med tanke på subjektiv skyld]",
    ]),
    p("[stønadsmottaker] søkte om AAP [dato], jf. vedlegg x."),
    p("Nav arbeid og ytelser innvilget i vedtak [dato] AAP fra [dato] til [dato], jf. vedlegg x."),
    p(
      "Retten til AAP ble forlenget til og med [dato], i vedtak [dato, dato og dato], jf. vedlegg x-x.",
    ),
    p(
      "[stønadsmottaker] har sammen med Nav utarbeidet aktivitetsplan(er) som inneholder de aktiviteter og tiltak som er nødvendige og hensiktsmessige for å komme tilbake i arbeid. Det kommer frem av planene til [stønadsmottaker] at han/hun i periodene [dato – dato og dato – dato] har som aktivitet å [ … ], jf. vedlegg x. Aktivitetene er gjennomført/ikke gjennomført.",
    ),
    p("[Hvis aktuelt:]"),
    p("AAP ble stanset i vedtak [dato] fordi [oppgi årsak], jf. vedlegg x."),
    p("[Hvis aktuelt:]"),
    p(
      "[stønadsmottaker] har i stønadsperioden hatt mye kontakt med Nav, jf. vedlegg x. Det fremgår ikke at utlandsopphold har vært et tema. [Ikke vedlegg alle notat/Modia dersom utlandsopphold ikke har vært tema. Kan da skrive at vi ettersender på forespørsel/hvis aktuelt.]",
    ),
    p(
      "AAP ble utbetalt for perioden [dato – dato], jf. vedlegg x. [Ev. utbetalingshistorikk som viser faktisk utbetaling.]",
    ),
    p(
      "Som mottaker av AAP plikter man blant annet å fylle ut og sende meldekort til Nav hver 14. dag. Meldekortet er en egenmelding der det skal gis opplysninger om stønadsmottakers situasjon de foregående 14 dager (meldeperioden), om eventuelt antall timer lønnet arbeid, om antall dager man har deltatt på tiltak/kurs/utdanning, vært syk, hatt ferie/fravær m.m. Opplysningene på meldekortet danner grunnlaget for beregning og anvisning av AAP.",
    ),
    p(
      "[stønadsmottaker] sendte elektroniske meldekort i den aktuelle perioden. [stønadsmottaker] har ikke krysset av for ferie/fravær på meldekortene som gjelder anmeldt periode, jf. vedlegg x. [NB: annen tekst og annet innhold i Kelvin]",
    ),

    h2("Informasjon bruker har fått om rettigheter og plikter"),
    p(
      "[Ta med de formuleringer og avsnitt som passer til saken. Vær obs på de ulike versjonene av søknadsdialoger, vedtak, vedlegg, meldekort m.m.]",
    ),
    p(
      "[Dersom det er gitt relevant direkte informasjon muntlig eller i dialog i Modia om rettigheter og plikter, føring av meldekort, inkludert varsling/føring av ferie, utlandsopphold, om endringer i situasjonen som kunne ha betydning for retten til AAP m.m., må du ta med dette.]",
    ),

    h3("Informasjon i søknad"),
    p(
      "[stønadsmottaker] har i søknadsdialogen [hent tekst fra aktuell søknad der bruker bekrefter å ha gitt riktige opplysninger*] [dato] bekreftet følgende [ … ], jf. vedlegg x.",
    ),
    p(
      "Søknaden kan enten sendes digitalt eller per post. Bruker har sendt digital søknad / søknad per post.",
    ),
    p(
      "I den digitale søknadsdialogen (versjon per 11.03.2024*) fremgår følgende [hent tekst fra aktuell søknad], jf. vedlegg x:",
    ),
    p("«Hvis du får penger du ikke har rett til, er du forberedt på at du må betale dem tilbake.»"),
    p("«Du har plikt til å gi beskjed hvis situasjonen din endrer seg.»"),
    p("«Jeg vil svare så godt jeg kan på spørsmålene i søknaden»"),
    p(
      "[*For fullstendig versjon av aktuell søknadsdialog må du se i Gosys eller ta kontakt med Porten.]",
    ),

    h3("Informasjon i vedtak med vedlegg"),
    p(
      "Det fremgår av vedtaket [hent tekst fra aktuelt vedtak], jf. vedlegg x (eksempel fra versjon februar 2023):",
    ),
    p(
      "«Hvis det skjer endringer som kan ha betydning for stønaden du får utbetalt, må du straks melde fra til oss. Du finner mer informasjon på Nav.no/rettogplikt. ….»",
    ),
    p("«Du kan lese mer om hvordan du fyller ut meldekort på Nav.no/meldekort.»"),
    p(
      "[I andre versjoner av vedtak kan det være gitt annen informasjon, for eksempel «at uriktige eller ufullstendige opplysninger kan medføre krav om tilbakebetaling av mottatte arbeidsavklaringspenger og straffeansvar».]",
    ),
    p(
      "I vedlegg til vedtak om AAP (eksempel fra versjon februar 2023) er det blant annet orientert om [hent tekst fra aktuelt vedlegg], jf. vedlegg x:",
    ),
    p("«Du må melde fra til oss hvis du"),
    ul([
      "reiser utenfor EØS",
      "flytter ut av Norge",
      "skal avvikle ferie eller permisjon",
      "får barnetillegg og barnet skal oppholde seg utenfor EØS",
      "har andre opplysninger som kan bety noe for retten til ytelser»",
    ]),

    h3("Informasjon på meldekort"),
    p(
      "I forbindelse med innsending av meldekort er det gitt slik informasjon [hent tekst fra aktuelle meldekort som du finner i Gosys] (versjon gjeldende mars 2024):",
    ),
    p(
      '«Du må lese veiledningstekstene før du fyller ut feltene i meldekortet. Du finner dem ved å klikke på "Les mer" under hvert spørsmål. Du må oppgi riktige og fullstendige opplysninger. Gjør du ikke det, kan det føre til at du må betale tilbake det du feilaktig har fått utbetalt.», jf. vedlegg x.',
    ),
    p(
      "I meldekortet fremgår denne hjelpeteksten direkte til spørsmålet (versjon gjeldende mars 2024):",
    ),
    p(
      "«Har du hatt ferie eller fravær slik at du ikke har kunnet ta arbeid eller gjennomføre avtalt aktivitet?»",
    ),
    p(
      "«Du skal svare ja hvis du ikke har kunnet ta arbeid eller gjennomføre avtalt aktivitet, og dette ikke skyldes at du har vært syk. Det gjelder f.eks. hvis du har hatt ferie og derfor ikke kunnet gjennomføre avtalt aktivitet. Det gjelder også opphold i utlandet som ikke er godkjent av NAV. Er du statsborger i et EU/EØS-land og oppholder deg i et annet EU/EØS land, skal oppholdet ikke godkjennes av NAV.",
    ),
    p(
      "Du skal svare ja hvis du ikke har avtalt noe aktivitet med NAV i perioden, og ikke er tilgjengelig for NAV mens du skal være borte.",
    ),
    p("Fravær vil normalt føre til trekk i utbetalingen."),
    p(
      "Hvis du vil beholde arbeidsavklaringspenger i den perioden du er borte, må du ta kontakt med NAV i god tid på forhånd. Hvis sterke velferdsgrunner er årsak til fravær, kan NAV likevel vurdere at du kan få penger og du må kontakte NAV første fraværsdag.",
    ),
    p("Hvis du ikke har hatt ferie eller annet fravær svarer du nei.», jf. vedlegg x."),
    p(
      "Til slutt på meldekortet informeres det om følgende: «Jeg er kjent med at hvis opplysningene jeg har oppgitt ikke er riktige og fullstendige kan det føre til at jeg må betale tilbake det jeg har fått feilaktig utbetalt. Jeg bekrefter at jeg har lest og forstått veiledningstekstene.», jf. vedlegg x.",
    ),

    h2("Utredning av saken"),
    p("[Du skal for eksempel redegjøre for:]"),
    ul([
      "[hvordan og når Nav / Nav kontroll ble kjent med forholdet (i saksbehandling, anonymt tips, opplysninger fra samarbeidende etater, politiet, annet)]",
      "[opplysninger som er innhentet]",
      "[at det er utarbeidet kontrollrapport]",
    ]),
    p("[Hvis aktuelt:]"),
    p("Nav kontroll mottok [dato] tips om at [stønadsmottaker] [innhold i tips]."),
    p("Tips vedlegges ikke."),

    h3("Valutaregister"),
    p(
      "Vi har gjort søk i Valutaregisteret for perioden [dato – dato], jf. vedlegg x. Valutaregisteret viser [for eksempel månedlig bruk av norsk betalingskort i utlandet, samt veksling til utenlandsk valuta]. [Bruk tabell ved behov.]",
    ),

    h3("Opplysninger fra bank"),
    p(
      "For perioden [dato – dato] har vi innhentet opplysninger fra følgende banker: [bank og ev. kontonummer], jf. vedlegg x. [Bruk gjerne tabell ved flere konti.]",
    ),
    p(
      "Av kontoutskriftene fremgår: [Dersom du ikke bruker tabell, skriv om det som fremkommer av kontoutskrifter.]",
    ),
    p(
      "[stønadsmottaker] er kontoeier og eneste disponent på konto. / I tillegg til [stønadsmottaker] er [person] disponent på kontoen.",
    ),
    p(
      "[Få med om det er utstedt flere bankkort til kontoene til stønadsmottaker og ev. kortnummer, samt hvilken konto som er stønadskonto.]",
    ),
    p(
      "Vi har laget en oversikt over når det er gjort uttak og varekjøp i Norge og i utlandet. Oversikten viser at [hovedtrekk uttak og varekjøp], jf. vedlegg x.",
    ),

    h3("Opplysninger fra [andre kilder]"),
    p(
      "[For eksempel Helfo, Grensekontroll, sosiale medier, internett, barns skolegang og andre relevante kilder.]",
    ),

    h3("Kontrollrapport"),
    p(
      "Nav kontroll har på bakgrunn av de innhentede opplysningene utarbeidet kontrollrapport, jf. vedlegg x, og sendt saken til Nav arbeid og ytelser til behandling.",
    ),

    h2("Forvaltningsrettslig behandling"),
    p("[Du skal for eksempel redegjøre for:]"),
    ul([
      "[de vedtak som er fattet; opphør, stans og tilbakebetaling]",
      "[eventuelle merknader fra bruker]",
      "[hvorvidt vedtakene er påklaget/påanket]",
      "[eventuelle avvik mellom tilbakekrevd beløp/periode og anmeldt beløp/periode, samt årsak til avviket]",
      "[tidligere feilutbetalingssaker og/eller straffesaker (slike forhold kan belyse brukers skyld samt være straffeskjerpende)]",
    ]),
    p(
      "Nav arbeid og ytelser varslet [stønadsmottaker] [dato] om stans / feilutbetaling av AAP i perioden / i flere perioder i tidsrommet [dato – dato], jf. vedlegg x.",
    ),
    p(
      "Alt 1: Nav arbeid og ytelser mottok tilbakemelding på varselbrevet [dato], jf. vedlegg x. [stønadsmottaker] skriver her at [gi et kort sammendrag].",
    ),
    p("Alt 2: Nav arbeid og ytelser mottok ingen tilbakemelding på varselbrevet."),
    p(
      "Nav arbeid og ytelser fattet [dato] vedtak om tilbakekreving av feilutbetalt AAP for perioden / flere perioder i tidsrommet [dato – dato] med [beløp] kroner, jf. vedlegg x, hvorav brutto feilutbetalt AAP utgjør [beløp] kroner, og rentetillegg utgjør [beløp] kroner. [Gjengi det som fremgår av vedtaket, for eksempel hvis det er gjort fradrag for skatt.]",
    ),
    p(
      "Vedtaket er / er ikke påklaget [dato]. [Er vedtaket påklaget, skriv kort om klagen og klageinstansens vedtak.]",
    ),
    p("[Hvis aktuelt:]"),
    p(
      "Anmeldt beløp ([beløp] kroner) avviker fra feilutbetalt beløp ([beløp] kroner) av bevismessige årsaker. Vi har valgt å anmelde forholdet fra [dato], da det først fra dette tidspunktet er registrert kortbruk i utlandet. / Vi har valgt å bare anmelde perioder det er registrert kortbruk i utlandet. / Vi har valgt å anmelde forholdet fra / frem til [dato] fordi [stønadsmottaker] da fikk orientering om [ … ]. Vi har fått gjort ny beregning av anmeldt beløp, jf. vedlegg x.",
    ),

    h1("Relevante regler i folketrygdloven [med flere] på gjerningstidspunktet"),
    p("[Aktuelle bestemmelser med lovhenvisning. Ev. hjelpedokument.]"),
    p(
      "Formålet med AAP er å sikre inntekt ved nedsatt arbeidsevne som skyldes sykdom, skade eller lyte, og der bruker får aktiv behandling, deltar på arbeidsrettet tiltak eller får annen oppfølging med sikte på å skaffe seg eller beholde arbeid, jf. folketrygdloven § 11-1.",
    ),
    p(
      "Det er krav til opphold i Norge, annet EØS-land eller land Norge har trygdeavtale med. For en som ikke er EØS-borger er det krav om opphold i Norge, med mindre annet følger av annen trygdeavtale, jf. § 11-3.",
    ),
    p(
      "AAP ytes når bruker får medisinsk behandling eller deltar på et arbeidsrettet tiltak utenfor Norge, i samsvar med aktivitetsplanen, se arbeids- og velferdsforvaltningsloven § 14 a. Det kan også ellers ytes AAP under opphold utenfor Norge i inntil fire uker per kalenderår. Det er en forutsetning at oppholdet er forenlig med gjennomføringen av fastsatt aktivitet og ikke hindrer oppfølging og kontroll. Det må på forhånd søkes om godkjenning av oppholdet, jf. § 11-3.",
    ),
    p(
      "Plikt til å gi korrekte opplysninger og underrette om endringer: En person som krever en ytelse har plikt til å gi opplysninger og levere de erklæringer og attester som er nødvendige. Den som mottar en ytelse, plikter å underrette om endringer i forhold som kan være avgjørende for om vedkommende fortsatt har rett til ytelsen eller utmåling av ytelsen, jf. folketrygdloven § 21-3.",
    ),
    p(
      "Alle som mottar AAP har i tillegg en særskilt meldeplikt, og må fylle ut og sende meldekort til Nav hver 14. dag, jf. folketrygdloven § 11-10. Meldekortet er en egenmelding der det skal gis opplysninger om stønadsmottakers situasjon de foregående 14 dager. Opplysningene på meldekortet danner grunnlaget for en automatisk beregning og anvisning av stønaden.",
    ),
    p(
      "Det vil si at selv om en stønadsmottaker har oppfylt den generelle meldeplikten, jf. folketrygdloven § 21-3, så blir selve anvisningen og utbetalingen av stønaden styrt av den særskilte meldeplikten på meldekortene.",
    ),
    p("[Hvis aktuelt:]"),
    p(
      "[Aktuelle rettsavgjørelser/uttalelser med henvisning til hvor de er publisert, for eksempel Rt-1982-1859.]",
    ),

    h1("Vurdering"),
    p(
      "[stønadsmottaker] har etter vår oppfatning med forsett om å skaffe seg eller andre en uberettiget vinning rettsstridig påvirket resultatet av en automatisk databehandling, og derfor urettmessig fått utbetalt AAP med [beløp] kroner.",
    ),
    p(
      "Vi mener vi kan dokumentere at [stønadsmottaker] har holdt tilbake opplysninger / har gitt uriktige opplysninger om at han/hun har oppholdt seg i utlandet i anmeldte perioder, samtidig som han/hun har mottatt AAP. Oppholdet var ikke godkjent av Nav.",
    ),
    p("Vi har lagt vekt på dette: [Bruk gjerne kulepunkter.]"),
    p(
      "[Dersom bruker har fremsatt merknader i forbindelse med saken, må du vurdere og kommentere disse. Kun de anførslene som kan ha betydning for de objektive straffbarhetsvilkårene.]",
    ),
    p(
      "Videre mener vi at [stønadsmottaker] har fått tilstrekkelig informasjon om at AAP skal reduseres/opphøre ved utenlandsopphold utenfor EØS, og at hun/han må melde fra til Nav om dette. [Må være presist og knytte seg til vilkårene for ytelsen.]",
    ),
    p("Vi viser til [ta med det som er aktuelt]:"),
    ul([
      "vedtak [dato] [gjengi relevant informasjon]",
      "vedlegg til vedtak [dato] [gjengi relevant informasjon]",
      "veiledning i søknadsdialogen [dato] [gjengi relevant informasjon]",
      "notat [dato] [gjengi relevant informasjon]",
      "informasjon gitt på Nav.no [gjengi relevant informasjon som var tilgjengelig på aktuelt tidspunkt]",
      "[annen relevant informasjon]",
    ]),
    p(
      "[Her skal du vise til gitt informasjon som tilsier at bruker må ha vært klar over at forholdet er i strid med stønaden, og meldepliktig. Er informasjonen gitt flere ganger, må du si noe om dette, for eksempel at bruker har mottatt flere vedtak, vedlegg m.m.]",
    ),
    p("[Hvis aktuelt:]"),
    pMedVariabler(
      "Nav kontroll ",
      variabel("avdeling"),
      " kan ikke se at språklige utfordringer / andre forhold i saken har hindret [stønadsmottaker] i å tilegne seg og forstå den informasjonen som er gitt. [Begrunn hvorfor.] Manglende språkkompetanse / lese- og skrivevansker / sykdom / kognitive vansker kan dermed ikke forklare at han/hun har gitt uriktige opplysninger / i meldekort / om utenlandsopphold m.m.",
    ),
    p(
      "Vi mener [stønadsmottaker] må ha opptrådt bevisst og viser til at [her skal du gjengi særlige forhold som kan bevise brukers skyldgrad, som hovedregel forsett. Eksempler på dette kan være]:",
    ),
    ul([
      "[bruker oppgir til Nav at han/hun er for syk / forhindret fra å delta på tiltak på et tidspunkt vedkommende er i utlandet]",
      "[bruker unnlater å gi eller gir uriktige opplysninger om utlandsopphold i sin kontakt med Nav]",
      "[brukers forklaring samsvarer ikke med faktisk føring av meldekortene]",
      "[bruker erkjenner for eksempel at han/hun har vært i [land utenfor EØS] i perioder]",
    ]),
    p(
      "[Dersom bruker har fremsatt merknader i forbindelse med saken, må du vurdere å kommentere disse. Kun de anførslene som kan ha betydning for de subjektive straffbarhetsvilkårene.]",
    ),
    p(
      "[Vi skal være tilnærmet sikre på at bruker har gjort seg skyldig i en straffbar handling, og dette må også fremgå av vurderingen.]",
    ),
    pMedVariabler(
      "Nav kontroll ",
      variabel("avdeling"),
      " kan ikke se at brukers opptreden kan forstås annerledes enn som en bevisst handling som har gitt ham/henne en økonomisk fordel.",
    ),
    p(
      "Forholdet må etter vår oppfatning anses som bedrageri etter straffeloven § 371 bokstav b, ev. grovt bedrageri etter straffeloven § 372, jf. § 371 bokstav b.",
    ),
    p(
      "Vi mener at [stønadsmottaker] forsettlig har avgitt uriktig forklaring ved å oppgi uriktige opplysninger om opphold i utlandet på meldekort / holde tilbake opplysninger om de faktiske forhold [skriv mer konkret her, NB tekst på meldekort i Kelvin]. Dette er å anse som uriktig forklaring overfor offentlig myndighet, jf. straffeloven § 221 første ledd bokstav d.",
    ),
    p(
      "[Hvis aktuelt: Hvis opplysningene er holdt tilbake, må du ta med denne setningen om opplysningsplikt:]",
    ),
    p(
      "Etter folketrygdloven § 21-3 hadde [stønadsmottaker] plikt til å oppgi korrekte opplysninger til Nav.",
    ),
    p("[Hvis aktuelt:]"),
    p(
      "Vi ber politiet i etterforskningen avklare om brev/dokument [skriv mer konkret her] [dato] er ettergjort/forfalsket. Vi viser til at [arbeidsgiver/oppdragsgiver/lege/andre] har opplyst at [aktuelle dokumenter] ikke er utstedt/skrevet av den/de, alternativt at innholdet er endret. Dersom etterforskningen viser at dokumentene er ettergjort/forfalsket, anmelder vi også [stønadsmottaker] for overtredelse av straffeloven § 361 første ledd bokstav a og b.",
    ),
    p("[Hvis aktuelt:]"),
    h2("Vurdering medvirker"),
    p(
      "[Her må du kort gjengi de faktiske forhold som gir grunnlag for å anmelde vedkommende for medvirkning til bedrageriet. Dette kan for eksempel være at arbeidsgiver oppgir uriktige opplysninger om ansettelsesforhold og/eller inntekt, barnefar gir opplysninger om fiktiv adresse, underskriver uriktig brudderklæring m.m. (objektive). I tillegg må du vise til de forhold som tilsier at vedkommende gjorde dette bevisst og med forsett om vinning (subjektive).]",
    ),
    p(
      "Forholdet må etter vår oppfatning anses som bedrageri, straffeloven § 371 bokstav b, jf. § 15, ev. grovt bedrageri, straffeloven § 372, jf. § 371 bokstav b, jf. § 15.",
    ),
    p(
      "Vi mener at [navn] også forsettlig har avgitt uriktig forklaring ved å oppgi uriktige opplysninger / holde tilbake opplysninger om de faktiske forhold [skriv mer konkret her]. Dette er å anse som uriktig forklaring overfor offentlig myndighet, jf. straffeloven § 221 første ledd bokstav d.",
    ),

    h1("Sivilt rettskrav"),
    p(
      "I forbindelse med eventuell straffesak for domstolen ber vi om at den delen av det feilutbetalte beløpet som er foreldet, blir tatt med som et sivilt rettskrav, jf. straffeprosessloven § 3, jf. § 427 og foreldelsesloven § 11.",
    ),
    p("Kravet utgjør [beløp] kroner for perioden [dato – dato]."),
    p("Vi ber om at oppfyllelse av kravet blir satt som vilkår i en betinget dom."),
    p(
      "Politiet kan få informasjon om saldo i tilbakekrevingssaken fra Innkrevingssentralen for bidrag og tilbakebetalingskrav, tlf. 21 05 11 11.",
    ),
    p("[Hvis aktuelt:]"),
    p(
      "Det er ikke aktuelt å fremsette sivilt rettskrav i denne saken fordi Nav har tvangsgrunnlag gjennom vedtaket i tilbakekrevingssaken.",
    ),

    h1("Vitne(r) fra Nav"),
    p("Navn: "),
    p("Tlf. (direkte): "),
    p("Arbeidssted: "),
    p("Adresse til arbeidssted: "),
    p(
      "[Det må fremgå konkret hva vitnet kan forklare seg om, for eksempel utredning av saken, dokumentasjon i forbindelse med utredning, informasjon gitt i samtaler, brukers kontakt med Nav, beregning av feilutbetalt beløp m.m.]",
    ),

    h1("Kontaktperson"),
    p("Ved behov for bistand i saken er vår kontaktperson:"),
    pMedVariabler("Navn: ", variabel("saksbehandler")),
    p("Tlf. (direkte): "),
    pMedVariabler("Arbeidssted: Nav kontroll ", variabel("avdeling")),
    p("Adresse til arbeidssted: "),

    h1("Øvrig informasjon"),
    p("[stønadsmottaker] er informert i brev [dato] om at forholdet er anmeldt."),
    pMedVariabler(
      "Nav kontroll ",
      variabel("avdeling"),
      " ber om å bli informert når saken er avsluttet, med kopi av eventuell rettsbok.",
    ),
    p("Vedlagt følger sakens dokumenter."),

    p("Vennlig hilsen"),
    pMedVariabler("Nav kontroll ", variabel("avdeling")),
    tabell(
      rad(celle("[Navn]"), celle(pMedVariabler(variabel("saksbehandler")))),
      rad(celle("avdelingsdirektør"), celle("rådgiver/seniorrådgiver")),
    ),
    p("Antall vedlegg: "),
  ]);
}
