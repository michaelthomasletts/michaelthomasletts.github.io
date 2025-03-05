.. _mcu:

Mixed Credit Underwriting Model
-------------------------------

Retailers want to pay for products after they are sold; however, distributors and manufacturers want to be paid for products immediately upon delivery, if not in advance. Normally, that all too common friction is resolved through money lending and insurance; that is an especially common practice for grocery stores, bodegas, and markets, for instance. However, in the cannabis industry, financial institutions nearly always refuse to extend lines of credit to distributors, retailers, and manufacturers for legal and optical reasons. 

In addition to providing an e-commerce platform for buying and selling cannabis products, LeafLink has a credit underwriting team wholly dedicated to extending lines of credit to customers in the cannabis industry. Underwriting customers at LeafLink proved especially difficult, however, due to the overall scale of customers. In particular, it was especially difficult for underwriters to identify attractive prospects analytically -- that is, it was hard for analysts to find customers within LeafLink's data warehouse who are active on the platform and likely to pay back. 

I presented a proposal for a mixed model -- that is, a bespoke statisticacl model that combined various statistical descriptors, such as the median and mean, with linear and polynomial regression -- that did two things: 

- Identified attractive customers based on a set of business criteria. 
- Estimated future monthly spend, rounded to the nearest five-thousand dollars, which represented an offer for credit. 

Mixed modeling -- a technique often neglected in favor of more sophisticated statistical and machine learning techniques -- yielded superior predictive results in production and during testing, with respect to future marketplace spend, relative to conventional, industry standard time-series models, e.g. `prophet <https://facebook.github.io/prophet/>`_, due to the unique characteristics of the dataset. The product created forty new credit customers in the first month of operation, and it saved underwriters a large amount of time spent on data analysis and data scrubbing. Notably, this project demonstrated my ability to develop an end-to-end solution to a problem: design, proposal, research, testing and model training, and development.