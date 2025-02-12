Products
========

The following products represent a couple of high-impact examples of self-directed projects from my career that were subsequently turned into products; however, this list is not exhaustive; there are other examples from my career as well. 

When I say that the following projects were "self-directed", I mean to say that these are projects that I independently imagined, designed, and tested during my free-time, without being asked to do so, and that I submitted for review by senior engineers and managers. The following products, I feel, are notable because they _demonstrate_ my passion, motivation, empathy, and ability to independently identify and resolve pain-points for customers and colleagues through careful listening and planning.

##### Simple File Automation (SFA)

Historically, engineers tasked with weekly on-call duties within AIR DABI at Amazon Air grappled with a legacy process for ingesting CSV files from external business partners via SES and Lambda; that legacy process caused an enormous amount of stress for on-call engineers, as well as for customers, for two critical reasons: 

- Record changes required significant amounts of collaboration between on-call engineers and external business partners.
- The legacy product had sparse logging for debugging purposes that made investigation difficult not just for junior but also seasoned engineers. 

SFA is a modular product that can and has been forked for a variety of use-cases within Amazon Air. In addition to its core functionality as an FTP server and modular automated ETL product, SFA also offers customizable email notifications for monitoring. 

SFA is a successful product within AIR DABI because it empowers external business partners to independently manage the data that they share with AIR DABI via FTP server -- something that business stakeholders appreciate greatly, as it minimizes internal risk --  and significantly reduces stress for on-call engineers. SFA was a product idea that I imagined, tested, and presented for approval, and that I subsequently developed and deployed. AIR DABI is, to this day, from what I am told, continuing to fork SFA for different use-cases within Amazon Air.

##### Mixed Credit Underwriting Model

Retailers want to pay for products after they are sold; however, distributors and manufacturers want to be paid for products immediately upon delivery, if not in advance. Normally, that all too common friction is resolved through money lending and insurance; that is an especially common practice for grocery stores, bodegas, and markets, for instance. However, in the cannabis industry, financial institutions nearly always refuse to extend lines of credit to distributors, retailers, and manufacturers for legal and optical reasons. 

In addition to providing an e-commerce platform for buying and selling cannabis products, LeafLink has a credit underwriting team wholly dedicated to extending lines of credit to customers in the cannabis industry. Underwriting customers at LeafLink proved especially difficult, however, due to the overall scale of customers. In particular, it was especially difficult for underwriters to identify attractive prospects analytically -- that is, it was hard for analysts to find customers within LeafLink's data warehouse who are active on the platform and likely to pay back. 

I presented a proposal for a mixed model -- that is, a bespoke statisticacl model that combined various statistical descriptors, such as the median and mean, with linear and polynomial regression -- that did two things: 

- Identified attractive customers based on a set of business criteria. 
- Estimated future monthly spend, rounded to the nearest five-thousand dollars, which represented an offer for credit. 

Mixed modeling -- a technique often neglected in favor of more sophisticated statistical and machine learning techniques -- yielded superior predictive results in production and during testing, with respect to future marketplace spend, relative to conventional, industry standard time-series models, e.g. [prophet](https://facebook.github.io/prophet/), due to the unique characteristics of the dataset. The product created forty new credit customers in the first month of operation, and it saved underwriters a large amount of time spent on data analysis and data scrubbing. Notably, this project demonstrated my ability to develop an end-to-end solution to a problem: design, proposal, research, testing and model training, and development.