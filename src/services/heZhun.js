import * as XLSX from 'xlsx'

const cities = {
    "广东省本级": 4400,
    "广州市": 4401,
    "韶关市": 4402,
    "深圳市": 4403,
    "珠海市": 4404,
    "汕头市": 4405,
    "佛山市": 4406,
    "江门市": 4407,
    "湛江市": 4408,
    "茂名市": 4409,
    "肇庆市": 4412,
    "惠州市": 4413,
    "梅州市": 4414,
    "汕尾市": 4415,
    "河源市": 4416,
    "阳江市": 4417,
    "清远市": 4418,
    "东莞市": 4419,
    "中山市": 4420,
    "潮州市": 4451,
    "揭阳市": 4452,
    "云浮市": 4453,
    "横琴粤澳深度合作区": 4491
}

const baseUrl = 'https://tzxm.gd.gov.cn/tzxmspweb/api/publicityInformation'
const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTotalPages(keyWord, cityCode) {
    const response = await fetch(`${baseUrl}/selectHzByPage`, {
        method: 'POST',
        headers: headers,
        body: '{"flag":"10","nameOrCode":"' + keyWord + '","pageSize":15,"city":"' + cityCode + '","pageNumber":1}',
    });
    const data = await response.json();
    return data.data.totalPage;
}

async function getProjects(keyWord, cityCode, page) {
    const response = await fetch(`${baseUrl}/selectHzByPage`, {
        method: 'POST',
        headers: headers,
        body: '{"flag":"10","nameOrCode":"' + keyWord + '","pageSize":15,"city":"' + cityCode + '","pageNumber":' + page + '}',
    });
    const data = await response.json();
    return data.data.list;
}

async function getProjectDetails(id) {
    const response = await fetch(`${baseUrl}/getHzggInfoById`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ id: id })
    });
    const data = await response.json();
    return {
        projectName: data.data.projectName,
        applyOrgan: data.data.applyOrgan,
        beginDate: data.data.beginDate,
        overDate: data.data.overDate,
    };
}

export async function crawlHeZhun(keywords) {
    let results = []

    for (const [city, cityCode] of Object.entries(cities)) {
        for (const keyWord of keywords) {
            const totalPages = await getTotalPages(keyWord, cityCode)
            await sleep(10000)

            for (let page = 1; page <= totalPages; page++) {
                const projects = await getProjects(keyWord, cityCode, page)
                await sleep(10000)

                for (const project of projects) {
                    const details = await getProjectDetails(project.id)
                    await sleep(10000)
                    results.push({
                        城市: city,
                        项目名: details.projectName,
                        单位: details.applyOrgan,
                        开始时间: details.beginDate,
                        结束时间: details.overDate
                    })
                }
            }
        }
    }

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(results)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

    // 返回二进制数据
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
} 