// 设备信息收集功能
class DeviceCollector {
    constructor() {
        this.collectedData = {};
        this.init();
    }

    init() {
        this.collectDeviceInfo();
        this.setupFormHandler();
        this.displayBrowserInfo();
    }

    // 收集设备信息
    async collectDeviceInfo() {
        // 获取公网IP
        await this.getPublicIP();
        
        // 生成设备标识（替代MAC地址）
        this.generateDeviceId();
        
        // 收集屏幕信息
        this.collectScreenInfo();
    }

    // 获取公网IP
    async getPublicIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            this.collectedData.ipAddress = data.ip;
            document.getElementById('ipAddress').textContent = data.ip;
        } catch (error) {
            console.error('获取IP地址失败:', error);
            // 备用方案：尝试其他IP服务
            try {
                const response = await fetch('https://api64.ipify.org?format=json');
                const data = await response.json();
                this.collectedData.ipAddress = data.ip;
                document.getElementById('ipAddress').textContent = data.ip;
            } catch (fallbackError) {
                document.getElementById('ipAddress').textContent = '获取失败';
                this.collectedData.ipAddress = 'unknown';
            }
        }
    }

    // 生成设备标识
    generateDeviceId() {
        // 使用多种浏览器指纹生成唯一设备ID
        const components = [
            navigator.userAgent,
            navigator.platform,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            !!navigator.cookieEnabled,
            !!navigator.javaEnabled()
        ].join('|');

        // 生成简单哈希
        let hash = 0;
        for (let i = 0; i < components.length; i++) {
            const char = components.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        const deviceId = Math.abs(hash).toString(16).substring(0, 12);
        const formattedId = deviceId.match(/.{1,2}/g).join(':').toUpperCase();
        
        this.collectedData.deviceId = formattedId;
        document.getElementById('deviceId').textContent = formattedId;
    }

    // 收集屏幕信息
    collectScreenInfo() {
        this.collectedData.screenResolution = `${screen.width}x${screen.height}`;
        this.collectedData.colorDepth = `${screen.colorDepth}位`;
        document.getElementById('screenInfo').textContent = 
            `${screen.width}×${screen.height} (${screen.colorDepth}位)`;
    }

    // 显示浏览器信息
    displayBrowserInfo() {
        const browserInfo = this.getBrowserInfo();
        this.collectedData.browser = browserInfo;
        document.getElementById('browserInfo').textContent = browserInfo;
    }

    // 获取浏览器信息
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName;
        
        if (ua.includes("Chrome") && !ua.includes("Edg")) browserName = "Chrome";
        else if (ua.includes("Firefox")) browserName = "Firefox";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browserName = "Safari";
        else if (ua.includes("Edg")) browserName = "Edge";
        else browserName = "其他浏览器";
        
        return `${browserName} (${navigator.language})`;
    }

    // 设置表单处理
    setupFormHandler() {
        const form = document.getElementById('deviceForm');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm(form)) {
                return;
            }

            // 显示加载状态
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';

            try {
                await this.submitFormData(form);
                this.showToast('信息提交成功！', 'success');
                form.reset();
            } catch (error) {
                console.error('提交失败:', error);
                this.showToast('提交失败，请重试', 'error');
            } finally {
                // 恢复按钮状态
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        });
    }

    // 验证表单
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = '#f56565';
                isValid = false;
            } else {
                field.style.borderColor = '#e2e8f0';
            }
        });

        if (!isValid) {
            this.showToast('请填写所有必填字段', 'error');
        }

        return isValid;
    }

    // 提交表单数据
    async submitFormData(form) {
        const formData = new FormData(form);
        const userData = {
            userName: formData.get('userName'),
            department: formData.get('department'),
            phone: formData.get('phone') || '',
            deviceType: formData.get('deviceType'),
            location: formData.get('location') || '',
            purpose: formData.get('purpose') || '',
            ...this.collectedData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };

        // 由于GitHub Pages是静态的，我们使用本地存储模拟数据持久化
        // 实际使用时可以配合GitHub API或其他免费后端服务
        this.saveToLocalStorage(userData);
        
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 保存到本地存储（演示用）
    saveToLocalStorage(data) {
        let existingData = JSON.parse(localStorage.getItem('deviceCollectionData') || '[]');
        existingData.push(data);
        localStorage.setItem('deviceCollectionData', JSON.stringify(existingData));
        
        console.log('数据已保存到本地存储:', data);
        console.log('总记录数:', existingData.length);
    }

    // 显示提示信息
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 报表功能
class ReportViewer {
    constructor() {
        this.data = [];
        this.init();
    }

    init() {
        this.loadData();
        this.renderReport();
        this.setupExportHandlers();
    }

    loadData() {
        const storedData = localStorage.getItem('deviceCollectionData');
        this.data = storedData ? JSON.parse(storedData) : [];
    }

    renderReport() {
        this.renderStats();
        this.renderTable();
    }

    renderStats() {
        const totalElement = document.getElementById('totalRecords');
        const departmentsElement = document.getElementById('uniqueDepartments');
        const deviceTypesElement = document.getElementById('deviceTypes');

        if (totalElement) {
            totalElement.textContent = this.data.length;
        }

        if (departmentsElement) {
            const departments = new Set(this.data.map(item => item.department));
            departmentsElement.textContent = departments.size;
        }

        if (deviceTypesElement) {
            const deviceTypes = this.data.reduce((acc, item) => {
                acc[item.deviceType] = (acc[item.deviceType] || 0) + 1;
                return acc;
            }, {});
            
            const typeCount = Object.keys(deviceTypes).length;
            deviceTypesElement.textContent = typeCount;
        }
    }

    renderTable() {
        const tbody = document.querySelector('#dataTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.escapeHtml(item.userName)}</td>
                <td>${this.escapeHtml(item.department)}</td>
                <td>${this.escapeHtml(item.ipAddress)}</td>
                <td>${this.escapeHtml(item.deviceId)}</td>
                <td>${this.escapeHtml(item.deviceType)}</td>
                <td>${this.escapeHtml(item.phone)}</td>
                <td>${this.escapeHtml(item.location)}</td>
                <td>${this.formatDate(item.timestamp)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }

    setupExportHandlers() {
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `device-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('数据导出成功！');
    }

    showToast(message) {
        // 简单的提示实现
        alert(message);
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // 判断当前页面类型
    if (document.getElementById('deviceForm')) {
        // 收集页面
        new DeviceCollector();
    } else if (document.getElementById('dataTable')) {
        // 报表页面
        new ReportViewer();
    }
});