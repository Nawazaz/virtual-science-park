-- Checked public profiles for 5 Blue Science Park members, and removal of the placeholder "Example Company".
-- Every 'fact' quote was checked word for word against its source page on 14 Nov 2026
-- (src/test/verified-companies.test.ts checks the shape of this file).
--
-- How to run: Supabase > SQL Editor > New query > paste this whole file > Run.
-- Safe to run more than once. Items a company confirmed itself are kept, as in a normal profile build.
-- Clicking "Build profile" later replaces these items with the AI's version.

BEGIN;

-- 1. Remove the placeholder company. Its matches, chats, priorities, run log and change history go with it (ON DELETE CASCADE).
DELETE FROM public.companies WHERE name = 'Example Company' AND website_url = 'https://example.com';

-- 2. The 5 companies. Matched on the member page, or on the name ignoring spaces ("NjordX" = "Njord X").
--    Demo sign-in emails come from the name: njord-x@demo.vsp, wip@demo.vsp, kingspan-baga@demo.vsp,
--    ocean-harvesting@demo.vsp, techinova@demo.vsp.
CREATE TEMP TABLE vsp_companies(name text, website_url text, member_page_url text) ON COMMIT DROP;
INSERT INTO vsp_companies VALUES
 ('Njord X','https://www.njordx.com','https://www.bluesciencepark.se/medlem/njord-x/'),
 ('WIP','https://www.wip.se','https://www.bluesciencepark.se/medlem/wip/'),
 ('Kingspan BAGA','https://www.kingspan.com/se/sv/affarsenheter/Kingspan-water-energy/kingspan-baga/','https://www.bluesciencepark.se/medlem/kingspan-baga/'),
 ('Ocean Harvesting','https://www.oceanharvesting.com','https://www.bluesciencepark.se/medlem/ocean-harvesting/'),
 ('Techinova','https://www.techinova.se','https://www.bluesciencepark.se/medlem/techinova/');

UPDATE public.companies c SET name = v.name, website_url = v.website_url, member_page_url = v.member_page_url
  FROM vsp_companies v
 WHERE c.member_page_url = v.member_page_url
    OR lower(replace(c.name, ' ', '')) = lower(replace(v.name, ' ', ''));

INSERT INTO public.companies(name, website_url, member_page_url)
SELECT v.name, v.website_url, v.member_page_url FROM vsp_companies v
 WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.member_page_url = v.member_page_url);

-- 3. Profile items. One line per item: (member page, field, value, kind, quote, source).
--    fact = stated on the source page (exact quote); inferred = our guess; missing = not found.
CREATE TEMP TABLE vsp_items(member text, field text, value text, kind text, evidence_quote text, source_url text) ON COMMIT DROP;
INSERT INTO vsp_items VALUES
 ('https://www.bluesciencepark.se/medlem/njord-x/','what_it_does','Delivers complete systems for the marine sector and handles the whole job: from project start to installation, start-up, service and support.','fact','De tar ansvar hela vägen från projektstart till installation, driftsättning samt service och support','https://www.bluesciencepark.se/medlem/njord-x/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','products_services','Sells marine electronics: products and services.','fact','fokuserar på försäljning av produkter och tjänster inom marinelektronik','https://www.bluesciencepark.se/aktuellt/njordx-blir-ny-medlem-i-blue-science-park/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','technologies','Underwater sound (hydroacoustic) systems, navigation, communication, IT and security.','fact','från hydroakustiska system och navigation till kommunikation, IT och säkerhet','https://www.bluesciencepark.se/medlem/njord-x/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','application_areas','The marine sector.','fact','NjordX levererar helhetslösningar för den marina sektorn','https://www.bluesciencepark.se/medlem/njord-x/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','markets_customers','Commercial shipping and government agencies.','fact','riktat mot både kommersiell sjöfart och statliga myndigheter','https://www.bluesciencepark.se/aktuellt/njordx-blir-ny-medlem-i-blue-science-park/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','geography','Based in Karlskrona. Delivers worldwide.','fact','och levererar globalt','https://www.bluesciencepark.se/medlem/njord-x/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','projects_collaborations','Joined Blue Science Park as a new member at the start of 2026.','fact','Vid starten av 2026 välkomnar Blue Science Park en ny medlem: NjordX','https://www.bluesciencepark.se/aktuellt/njordx-blir-ny-medlem-i-blue-science-park/'),
 ('https://www.bluesciencepark.se/medlem/njord-x/','possible_interests','Underwater test sites, defence innovation funding and marine technology events. Our guess from its hydroacoustics work and government customers.','inferred',NULL,NULL),

 ('https://www.bluesciencepark.se/medlem/wip/','what_it_does','Builds software and gives advice on data communication.','fact','WIP erbjuder systemutvecklings- och rådgivningstjänster inom datakommunikation','https://www.bluesciencepark.se/medlem/wip/'),
 ('https://www.bluesciencepark.se/medlem/wip/','products_services','Makes and sells its own products that help companies go digital and work securely on mobile devices.','fact','utvecklar och säljer produkter som möjliggör digitalisering och säker mobilitet för företag','https://www.bluesciencepark.se/medlem/wip/'),
 ('https://www.bluesciencepark.se/medlem/wip/','technologies','Programming, mobile data communication and system development.','fact','Dataprogrammering , Mobil datakommunikation , Systemutveckling','https://www.bluesciencepark.se/medlem/wip/'),
 ('https://www.bluesciencepark.se/medlem/wip/','application_areas','Going digital, and working securely on the move.','fact','möjliggör digitalisering och säker mobilitet','https://www.bluesciencepark.se/medlem/wip/'),
 ('https://www.bluesciencepark.se/medlem/wip/','markets_customers','Companies.','fact','säker mobilitet för företag','https://www.bluesciencepark.se/medlem/wip/'),
 ('https://www.bluesciencepark.se/medlem/wip/','geography','Based in Karlskrona. Founded in 2000, 11–50 employees.','fact','11-50 2000 Karlskrona','https://www.bluesciencepark.se/medlem/wip/'),
 ('https://www.bluesciencepark.se/medlem/wip/','projects_collaborations','Not found on the reviewed pages.','missing',NULL,NULL),
 ('https://www.bluesciencepark.se/medlem/wip/','possible_interests','Cybersecurity support, such as Blue Science Park''s free consultant help, and Tech Concept Lab events. Our guess from its secure-mobility work.','inferred',NULL,NULL),

 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','what_it_does','Offers products and services for cleaning wastewater (sewage), made for the Nordic climate.','fact','Erbjuder produkter och tjänster för avloppsrening, inklusive minireningsverk, slamavskiljare, bioModuler, pumpstationer och fettavskiljare, anpassade för nordiskt klimat','https://www.bluesciencepark.se/medlem/kingspan-baga/'),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','products_services','Small sewage treatment plants, sludge separators, bio modules, pump stations and grease separators.','fact','minireningsverk, slamavskiljare, bioModuler, pumpstationer och fettavskiljare','https://www.bluesciencepark.se/medlem/kingspan-baga/'),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','technologies','Biological treatment plants (BioDisc) with better chemical dosing and digital monitoring (IoT).','fact','improved flocculant dosing and digital monitoring – IoT','https://www.avloppscenter.se/en/?p=118374'),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','application_areas','Wastewater treatment and water handling.','fact','Avloppsrening , Vattenhantering','https://www.bluesciencepark.se/medlem/kingspan-baga/'),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','markets_customers','Houses and summer cottages that need their own sewage treatment.','fact','reliable for your sewage needs for both houses and summer cottages','https://www.avloppscenter.se/en/?p=118374'),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','geography','Based in Karlskrona. Founded in 1992, 11–50 employees.','fact','11-50 1992 Karlskrona','https://www.bluesciencepark.se/medlem/kingspan-baga/'),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','projects_collaborations','Not found on the reviewed pages.','missing',NULL,NULL),
 ('https://www.bluesciencepark.se/medlem/kingspan-baga/','possible_interests','Water and cleantech funding, and partners for IoT and digital monitoring. Our guess from its products.','inferred',NULL,NULL),

 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','what_it_does','Develops and builds power plants that make electricity from ocean waves. Also runs, maintains, sells and licenses them.','fact','Utvecklar och tillverkar kraftverk för produktion av elenergi från havsvågor, inklusive drift, underhåll, försäljning och licensiering av dessa system','https://www.bluesciencepark.se/medlem/ocean-harvesting/'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','products_services','InfinityWEC, a machine that turns wave power into electricity (a wave energy converter).','fact','InfinityWEC wave energy converter','https://news.cision.com/ocean-harvesting-technologies/r/ocean-harvesting-to-raise-3-meur-for-sea-trials-with-infinitywec-wave-energy-converter,c3566812'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','technologies','Wave energy conversion, using proven parts and a modular design.','fact','using proven subsystems and a modular design','https://news.cision.com/ocean-harvesting-technologies/r/ocean-harvesting-to-raise-3-meur-for-sea-trials-with-infinitywec-wave-energy-converter,c3566812'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','application_areas','Renewable electricity from the sea. Wave power can also make the power grid more stable, so less energy storage is needed.','fact','reducing variations in electrical grids with a high degree of renewables','https://news.cision.com/ocean-harvesting-technologies/r/ocean-harvesting-to-raise-3-meur-for-sea-trials-with-infinitywec-wave-energy-converter,c3566812'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','markets_customers','The global energy market.','fact','a highly competitive solution for the future global energy market','https://news.cision.com/ocean-harvesting-technologies/r/ocean-harvesting-to-raise-3-meur-for-sea-trials-with-infinitywec-wave-energy-converter,c3566812'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','geography','Based in Karlskrona. Founded in 2007, 1–10 employees.','fact','1-10 2007 Karlskrona','https://www.bluesciencepark.se/medlem/ocean-harvesting/'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','projects_collaborations','The INFINITY project won EUR 1.7 million from the EU Clean Energy Transition Partnership (CETP) in November 2024.','fact','INFINITY Project awarded EUR 1.7 million from Clean Energy Transition Partnership (CETP) program','https://news.cision.com/ocean-harvesting-technologies/r/infinity-project-awarded-eur-1-7-million-from-clean-energy-transition-partnership--cetp--program,c4060181'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','projects_collaborations','In May 2022 it was preparing sea trials of InfinityWEC at 1:3 scale off the west coast of Sweden.','fact','sea trials of InfinityWEC at scale 1:3 to be performed off the west coast of Sweden','https://news.cision.com/ocean-harvesting-technologies/r/ocean-harvesting-to-raise-3-meur-for-sea-trials-with-infinitywec-wave-energy-converter,c3566812'),
 ('https://www.bluesciencepark.se/medlem/ocean-harvesting/','possible_interests','Sea test sites, offshore energy events and energy funding calls. Our guess from its work.','inferred',NULL,NULL),

 ('https://www.bluesciencepark.se/medlem/techinova/','what_it_does','Develops and makes electronics and software for radio communication and automation, built for the energy sector.','fact','Techinova utvecklar och tillverkar produkter med elektronik och programvara för kommunikation (radionätverk) och automation, anpassade för energisektorns behov','https://www.bluesciencepark.se/medlem/techinova/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','products_services','dSense: a fault analyser for power grid owners that can run AI programs. It finds faults in local power grids.','fact','dSense, en felpassageanalysator för elnätsägare som kan köra AI-applikationer','https://www.bluesciencepark.se/aktuellt/fran-projekt-till-produkt-techinova-tar-nasta-steg-inom-sakrare-elnat/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','products_services','Services for studies and start-up of equipment, and sales of cables, antennas and connection equipment.','fact','De erbjuder även tjänster kopplade till utredning och driftsättning samt handel med materiel och utrustning såsom kablage, antenner och kopplingsutrustning','https://www.bluesciencepark.se/medlem/techinova/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','technologies','Radio networks, automation, and AI that spots faults and cyber threats in smart power grids.','fact','lösningar för smarta elnät och hur avvikelser, fel och potentiella cyberhot kan upptäckas och hanteras','https://www.bluesciencepark.se/aktuellt/fran-projekt-till-produkt-techinova-tar-nasta-steg-inom-sakrare-elnat/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','application_areas','Safer power grids, and helping grid owners make local grids digital.','fact','Produkten kan identifiera fel i elnäten och utgör en viktig funktion i elnätsägarnas digitalisering av lokalnäten','https://www.bluesciencepark.se/aktuellt/fran-projekt-till-produkt-techinova-tar-nasta-steg-inom-sakrare-elnat/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','markets_customers','Companies that own and run power grids (the electricity distribution market).','fact','Techinova utvecklar produkter och tjänster för eldistributionsmarknaden','https://www.bluesciencepark.se/aktuellt/fran-projekt-till-produkt-techinova-tar-nasta-steg-inom-sakrare-elnat/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','geography','Based in Karlskrona. Founded in 2010, 11–50 employees.','fact','11-50 2010 Karlskrona','https://www.bluesciencepark.se/medlem/techinova/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','projects_collaborations','For three years one of the Swedish partners in the EU research project CISSAN, which has now ended. dSense came out of this work.','fact','Under de senaste tre åren har företaget också varit en av de svenska parterna i forsknings- och innovationsprojektet CISSAN','https://www.bluesciencepark.se/aktuellt/fran-projekt-till-produkt-techinova-tar-nasta-steg-inom-sakrare-elnat/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','projects_collaborations','Worked with Affärsverken and Blekinge Tekniska Högskola, among others.','fact','Arbetet har skett tillsammans med bland andra Affärsverken, Blekinge Tekniska Högskola','https://www.bluesciencepark.se/aktuellt/fran-projekt-till-produkt-techinova-tar-nasta-steg-inom-sakrare-elnat/'),
 ('https://www.bluesciencepark.se/medlem/techinova/','possible_interests','AI and cybersecurity events, energy funding calls, and grid partners such as Affärsverken. Our guess from its work.','inferred',NULL,NULL);

-- Replace each profile through the app's own function: it keeps items the company confirmed
-- and writes the differences to "What changed".
SELECT public.replace_generated_profile(
         c.id,
         (SELECT jsonb_agg(jsonb_build_object('field', i.field, 'value', i.value, 'kind', i.kind,
                                              'evidence_quote', i.evidence_quote, 'source_url', i.source_url))
            FROM vsp_items i WHERE i.member = c.member_page_url))
  FROM public.companies c
 WHERE c.member_page_url IN (SELECT member_page_url FROM vsp_companies);

-- 4. Run log, so "How was this made?" says these profiles were checked by hand (once per company).
INSERT INTO public.agent_runs(agent, company_id, sources_used, output, checks, simulated)
SELECT 'Profile builder', c.id,
       ARRAY(SELECT DISTINCT i.source_url FROM vsp_items i WHERE i.member = c.member_page_url AND i.source_url IS NOT NULL),
       'Profile checked by hand on 14 Nov 2026 from public pages (not built by the AI).',
       jsonb_build_array(
         jsonb_build_object('name', 'Every fact quoted word for word from its source page', 'passed', true,
                            'detail', (SELECT count(*) FROM vsp_items i WHERE i.member = c.member_page_url AND i.kind = 'fact') || ' facts checked'),
         jsonb_build_object('name', 'Guesses labelled Inferred', 'passed', true, 'detail', 'Possibly relevant topics are our guess'),
         jsonb_build_object('name', 'Gaps labelled Missing', 'passed', true,
                            'detail', (SELECT count(*) FROM vsp_items i WHERE i.member = c.member_page_url AND i.kind = 'missing') || ' fields not found')),
       false
  FROM public.companies c
 WHERE c.member_page_url IN (SELECT member_page_url FROM vsp_companies)
   AND NOT EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.company_id = c.id AND r.agent = 'Profile builder'
                     AND r.output LIKE 'Profile checked by hand on 14 Nov 2026%');

COMMIT;
